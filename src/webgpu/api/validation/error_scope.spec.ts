export const description = `
Error scope validation tests.

Note these must create their own device, not use GPUTest (that one already has error scopes on it).

TODO: (POSTV1) Test error scopes of different threads and make sure they go to the right place.
TODO: (POSTV1) Test that unhandled errors go the right device, and nowhere if the device was dropped.
`;

import { Fixture } from '../../../common/framework/fixture.js';
import { makeTestGroup } from '../../../common/framework/test_group.js';
import { getGPU } from '../../../common/util/navigator_gpu.js';
import { assert, raceWithRejectOnTimeout } from '../../../common/util/util.js';
import { kErrorScopeFilters, kGeneratableErrorScopeFilters } from '../../capability_info.js';

class ErrorScopeTests extends Fixture {
  _device: GPUDevice | undefined = undefined;

  get device(): GPUDevice {
    assert(this._device !== undefined);
    return this._device;
  }

  override async init(): Promise<void> {
    await super.init();
    const gpu = getGPU(this.rec);
    const adapter = await gpu.requestAdapter();
    assert(adapter !== null);
    const device = await adapter.requestDevice();
    assert(device !== null);
    this._device = device;
  }

  // Generates an error of the given filter type. For now, the errors are generated by calling a
  // known code-path to cause the error. This can be updated in the future should there be a more
  // direct way to inject errors.
  generateError(filter: GPUErrorFilter): void {
    switch (filter) {
      case 'out-of-memory':
        this.trackForCleanup(
          this.device.createTexture({
            // One of the largest formats. With the base limits, the texture will be 256 GiB.
            format: 'rgba32float',
            usage: GPUTextureUsage.COPY_DST,
            size: [
              this.device.limits.maxTextureDimension2D,
              this.device.limits.maxTextureDimension2D,
              this.device.limits.maxTextureArrayLayers,
            ],
          })
        );
        break;
      case 'validation':
        // Generating a validation error by passing in an invalid usage when creating a buffer.
        this.trackForCleanup(
          this.device.createBuffer({
            size: 1024,
            usage: 0xffff, // Invalid GPUBufferUsage
          })
        );
        break;
    }
    // MAINTENANCE_TODO: This is a workaround for Chromium not flushing. Remove when not needed.
    this.device.queue.submit([]);
  }

  // Checks whether the error is of the type expected given the filter.
  isInstanceOfError(filter: GPUErrorFilter, error: GPUError | null): boolean {
    switch (filter) {
      case 'out-of-memory':
        return error instanceof GPUOutOfMemoryError;
      case 'validation':
        return error instanceof GPUValidationError;
      case 'internal':
        return error instanceof GPUInternalError;
    }
  }

  // Expect an uncapturederror event to occur. Note: this MUST be awaited, because
  // otherwise it could erroneously pass by capturing an error from later in the test.
  async expectUncapturedError(fn: Function): Promise<GPUUncapturedErrorEvent> {
    return this.immediateAsyncExpectation(() => {
      // MAINTENANCE_TODO: Make arbitrary timeout value a test runner variable
      const TIMEOUT_IN_MS = 1000;

      const promise: Promise<GPUUncapturedErrorEvent> = new Promise(resolve => {
        const eventListener = ((event: GPUUncapturedErrorEvent) => {
          this.debug(`Got uncaptured error event with ${event.error}`);
          resolve(event);
        }) as EventListener;

        this.device.addEventListener('uncapturederror', eventListener, { once: true });
      });

      fn();

      return raceWithRejectOnTimeout(
        promise,
        TIMEOUT_IN_MS,
        'Timeout occurred waiting for uncaptured error'
      );
    });
  }
}

export const g = makeTestGroup(ErrorScopeTests);

g.test('simple')
  .desc(
    `
Tests that error scopes catches their expected errors, firing an uncaptured error event otherwise.

- Same error and error filter (popErrorScope should return the error)
- Different error from filter (uncaptured error should result)
    `
  )
  .params(u =>
    u.combine('errorType', kGeneratableErrorScopeFilters).combine('errorFilter', kErrorScopeFilters)
  )
  .fn(async t => {
    const { errorType, errorFilter } = t.params;
    t.device.pushErrorScope(errorFilter);

    if (errorType !== errorFilter) {
      // Different error case
      const uncapturedErrorEvent = await t.expectUncapturedError(() => {
        t.generateError(errorType);
      });
      t.expect(t.isInstanceOfError(errorType, uncapturedErrorEvent.error));

      const error = await t.device.popErrorScope();
      t.expect(error === null);
    } else {
      // Same error as filter
      t.generateError(errorType);
      const error = await t.device.popErrorScope();
      t.expect(t.isInstanceOfError(errorType, error));
    }
  });

g.test('empty')
  .desc(
    `
Tests that popping an empty error scope stack should reject.
    `
  )
  .fn(t => {
    const promise = t.device.popErrorScope();
    t.shouldReject('OperationError', promise);
  });

g.test('parent_scope')
  .desc(
    `
Tests that an error bubbles to the correct parent scope.

- Different error types as the parent scope
- Different depths of non-capturing filters for the generated error
    `
  )
  .params(u =>
    u
      .combine('errorFilter', kGeneratableErrorScopeFilters)
      .combine('stackDepth', [1, 10, 100, 1000])
  )
  .fn(async t => {
    const { errorFilter, stackDepth } = t.params;
    t.device.pushErrorScope(errorFilter);

    // Push a bunch of error filters onto the stack (none that match errorFilter)
    const unmatchedFilters = kErrorScopeFilters.filter(filter => {
      return filter !== errorFilter;
    });
    for (let i = 0; i < stackDepth; i++) {
      t.device.pushErrorScope(unmatchedFilters[i % unmatchedFilters.length]);
    }

    // Cause the error and then pop all the unrelated filters.
    t.generateError(errorFilter);
    const promises = [];
    for (let i = 0; i < stackDepth; i++) {
      promises.push(t.device.popErrorScope());
    }
    const errors = await Promise.all(promises);
    t.expect(errors.every(e => e === null));

    // Finally the actual error should have been caught by the parent scope.
    const error = await t.device.popErrorScope();
    t.expect(t.isInstanceOfError(errorFilter, error));
  });

g.test('current_scope')
  .desc(
    `
Tests that an error does not bubbles to parent scopes when local scope matches.

- Different error types as the current scope
- Different depths of non-capturing filters for the generated error
    `
  )
  .params(u =>
    u
      .combine('errorFilter', kGeneratableErrorScopeFilters)
      .combine('stackDepth', [1, 10, 100, 1000, 100000])
  )
  .fn(async t => {
    const { errorFilter, stackDepth } = t.params;

    // Push a bunch of error filters onto the stack
    for (let i = 0; i < stackDepth; i++) {
      t.device.pushErrorScope(kErrorScopeFilters[i % kErrorScopeFilters.length]);
    }

    // Current scope should catch the error immediately.
    t.device.pushErrorScope(errorFilter);
    t.generateError(errorFilter);
    const error = await t.device.popErrorScope();
    t.expect(t.isInstanceOfError(errorFilter, error));

    // Remaining scopes shouldn't catch anything.
    const promises = [];
    for (let i = 0; i < stackDepth; i++) {
      promises.push(t.device.popErrorScope());
    }
    const errors = await Promise.all(promises);
    t.expect(errors.every(e => e === null));
  });

g.test('balanced_siblings')
  .desc(
    `
Tests that sibling error scopes need to be balanced.

- Different error types as the current scope
- Different number of sibling errors
    `
  )
  .params(u =>
    u.combine('errorFilter', kErrorScopeFilters).combine('numErrors', [1, 10, 100, 1000])
  )
  .fn(async t => {
    const { errorFilter, numErrors } = t.params;

    const promises = [];
    for (let i = 0; i < numErrors; i++) {
      t.device.pushErrorScope(errorFilter);
      promises.push(t.device.popErrorScope());
    }

    {
      // Trying to pop an additional non-existing scope should reject.
      const promise = t.device.popErrorScope();
      t.shouldReject('OperationError', promise);
    }

    const errors = await Promise.all(promises);
    t.expect(errors.every(e => e === null));
  });

g.test('balanced_nesting')
  .desc(
    `
Tests that nested error scopes need to be balanced.

- Different error types as the current scope
- Different number of nested errors
    `
  )
  .params(u =>
    u.combine('errorFilter', kErrorScopeFilters).combine('numErrors', [1, 10, 100, 1000])
  )
  .fn(async t => {
    const { errorFilter, numErrors } = t.params;

    for (let i = 0; i < numErrors; i++) {
      t.device.pushErrorScope(errorFilter);
    }

    const promises = [];
    for (let i = 0; i < numErrors; i++) {
      promises.push(t.device.popErrorScope());
    }
    const errors = await Promise.all(promises);
    t.expect(errors.every(e => e === null));

    {
      // Trying to pop an additional non-existing scope should reject.
      const promise = t.device.popErrorScope();
      t.shouldReject('OperationError', promise);
    }
  });
