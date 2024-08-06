export const description = `
Validation tests for subgroupBallot
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { keysOf, objectsToRecord } from '../../../../../../common/util/data_tables.js';
import { Type, elementTypeOf, kAllScalarsAndVectors } from '../../../../../util/conversion.js';
import { ShaderValidationTest } from '../../../shader_validation_test.js';

export const g = makeTestGroup(ShaderValidationTest);

const kStages: Record<string, string> = {
  constant: `
enable subgroups;
@compute @workgroup_size(16)
fn main() {
  const x = subgroupBallot(true);
}`,
  override: `
enable subgroups;
override o = subgroupBallot(true);`,
  runtime: `
enable subgroups;
@compute @workgroup_size(16)
fn main() {
  let x = subgroupBallot(true);
}`,
};

g.test('early_eval')
  .desc('Ensures the builtin is not able to be compile time evaluated')
  .params(u => u.combine('stage', keysOf(kStages)))
  .beforeAllSubcases(t => {
    t.selectDeviceOrSkipTestCase('subgroups' as GPUFeatureName);
  })
  .fn(t => {
    const code = kStages[t.params.stage];
    t.expectCompileResult(t.params.stage === 'runtime', code);
  });

const kArgumentTypes = objectsToRecord(kAllScalarsAndVectors);

g.test('data_type')
  .desc('Validates data parameter type')
  .params(u => u.combine('type', keysOf(kArgumentTypes)))
  .beforeAllSubcases(t => {
    const features = ['subgroups' as GPUFeatureName];
    const type = kArgumentTypes[t.params.type];
    if (type.requiresF16()) {
      features.push('subgroups-f16' as GPUFeatureName);
      features.push('shader-f16');
    }
    t.selectDeviceOrSkipTestCase(features);
  })
  .fn(t => {
    const type = kArgumentTypes[t.params.type];
    let enables = `enable subgroups;\n`;
    if (type.requiresF16()) {
      enables += `enable subgroups_f16;\nenable f16;`;
    }
    const wgsl = `
${enables}
@compute @workgroup_size(1)
fn main() {
  _ = subgroupBallot(${type.create(0).wgsl()});
}`;

    t.expectCompileResult(type === Type.bool, wgsl);
  });

g.test('return_type')
  .desc('Validates data parameter type')
  .params(u =>
    u.combine('type', keysOf(kArgumentTypes)).filter(t => {
      const type = kArgumentTypes[t.type];
      const eleType = elementTypeOf(type);
      return eleType !== Type.abstractInt && eleType !== Type.abstractFloat;
    })
  )
  .beforeAllSubcases(t => {
    const features = ['subgroups' as GPUFeatureName];
    const type = kArgumentTypes[t.params.type];
    if (type.requiresF16()) {
      features.push('subgroups-f16' as GPUFeatureName);
      features.push('shader-f16');
    }
    t.selectDeviceOrSkipTestCase(features);
  })
  .fn(t => {
    const type = kArgumentTypes[t.params.type];
    let enables = `enable subgroups;\n`;
    if (type.requiresF16()) {
      enables += `enable subgroups_f16;\nenable f16;`;
    }
    const wgsl = `
${enables}
@compute @workgroup_size(1)
fn main() {
  let res : ${type.toString()} = subgroupBallot(true);
}`;

    t.expectCompileResult(type === Type.vec4u, wgsl);
  });

g.test('stage')
  .desc('Validates it is only usable in correct stage')
  .params(u => u.combine('stage', ['compute', 'fragment', 'vertex'] as const))
  .beforeAllSubcases(t => {
    t.selectDeviceOrSkipTestCase('subgroups' as GPUFeatureName);
  })
  .fn(t => {
    const compute = `
@compute @workgroup_size(1)
fn main() {
  foo();
}`;

    const fragment = `
@fragment
fn main() {
  foo();
}`;

    const vertex = `
@vertex
fn main() -> @builtin(position) vec4f {
  foo();
  return vec4f();
}`;

    const entry = { compute, fragment, vertex }[t.params.stage];
    const wgsl = `
enable subgroups;
fn foo() {
  _ = subgroupBallot(true);
}

${entry}
`;

    t.expectCompileResult(t.params.stage !== 'vertex', wgsl);
  });
