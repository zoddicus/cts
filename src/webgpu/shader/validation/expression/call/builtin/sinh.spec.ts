const builtin = 'sinh';
export const description = `
Validation tests for the ${builtin}() builtin.
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { keysOf, objectsToRecord } from '../../../../../../common/util/data_tables.js';
import {
  Type,
  elementType,
  kConcreteIntegerScalarsAndVectors,
  kConvertableToFloatScalarsAndVectors,
} from '../../../../../util/conversion.js';
import { isRepresentable } from '../../../../../util/floating_point.js';
import { ShaderValidationTest } from '../../../shader_validation_test.js';

import {
  fullRangeForType,
  kConstantAndOverrideStages,
  stageSupportsType,
  validateConstOrOverrideBuiltinEval,
} from './const_override_validation.js';

export const g = makeTestGroup(ShaderValidationTest);

const kValuesTypes = objectsToRecord(kConvertableToFloatScalarsAndVectors);

g.test('values')
  .desc(
    `
Validates that constant evaluation and override evaluation of ${builtin}() rejects invalid values
`
  )
  .params(u =>
    u
      .combine('stage', kConstantAndOverrideStages)
      .combine('type', keysOf(kValuesTypes))
      .filter(u => stageSupportsType(u.stage, kValuesTypes[u.type]))
      .beginSubcases()
      .expand('value', u => fullRangeForType(kValuesTypes[u.type]))
  )
  .beforeAllSubcases(t => {
    if (elementType(kValuesTypes[t.params.type]) === Type.f16) {
      t.selectDeviceOrSkipTestCase('shader-f16');
    }
  })
  .fn(t => {
    const type = kValuesTypes[t.params.type];
    const expectedResult = isRepresentable(
      Math.sinh(Number(t.params.value)),
      // AbstractInt is converted to AbstractFloat before calling into the builtin
      elementType(type).kind === 'abstract-int' ? Type.abstractFloat : elementType(type)
    );
    validateConstOrOverrideBuiltinEval(
      t,
      builtin,
      expectedResult,
      [type.create(t.params.value)],
      t.params.stage
    );
  });

const kIntegerArgumentTypes = objectsToRecord([Type.f32, ...kConcreteIntegerScalarsAndVectors]);

g.test('integer_argument')
  .desc(
    `
Validates that scalar and vector integer arguments are rejected by ${builtin}()
`
  )
  .params(u => u.combine('type', keysOf(kIntegerArgumentTypes)))
  .fn(t => {
    const type = kIntegerArgumentTypes[t.params.type];
    validateConstOrOverrideBuiltinEval(
      t,
      builtin,
      /* expectedResult */ type === Type.f32,
      [type.create(0)],
      'constant'
    );
  });
