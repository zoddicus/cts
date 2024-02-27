/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/export const description = `
Validation tests for derivative builtins.
`;import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { keysOf, objectsToRecord } from '../../../../../../common/util/data_tables.js';
import {
  TypeF16,
  TypeF32,
  TypeMat,
  elementType,
  kAllConcreteIntegerScalarsAndVectors,
  kAllF16ScalarsAndVectors } from
'../../../../../util/conversion.js';
import { ShaderValidationTest } from '../../../shader_validation_test.js';

export const g = makeTestGroup(ShaderValidationTest);

const kDerivativeBuiltins = [
'dpdx',
'dpdxCoarse',
'dpdxFine',
'dpdy',
'dpdyCoarse',
'dpdyFine',
'fwidth',
'fwidthCoarse',
'fwidthFine'];


const kEntryPoints = {
  none: { supportsDerivative: true, code: `` },
  fragment: {
    supportsDerivative: true,
    code: `@fragment
fn main() {
  foo();
}`
  },
  vertex: {
    supportsDerivative: false,
    code: `@vertex
fn main() -> @builtin(position) vec4f {
  foo();
  return vec4f();
}`
  },
  compute: {
    supportsDerivative: false,
    code: `@compute @workgroup_size(1)
fn main() {
  foo();
}`
  },
  fragment_and_compute: {
    supportsDerivative: false,
    code: `@fragment
fn main1() {
  foo();
}

@compute @workgroup_size(1)
fn main2() {
  foo();
}
`
  },
  compute_without_call: {
    supportsDerivative: true,
    code: `@compute @workgroup_size(1)
fn main() {
}
`
  }
};

g.test('only_in_fragment').
specURL('https://www.w3.org/TR/WGSL/#derivative-builtin-functions').
desc(
  `
Derivative functions must only be used in the fragment shader stage.
`
).
params((u) =>
u.combine('entry_point', keysOf(kEntryPoints)).combine('call', ['bar', ...kDerivativeBuiltins])
).
fn((t) => {
  const config = kEntryPoints[t.params.entry_point];
  const code = `
${config.code}
fn bar(f : f32) -> f32 { return f; }

fn foo() {
  _ = ${t.params.call}(1.0);
}`;
  t.expectCompileResult(t.params.call === 'bar' || config.supportsDerivative, code);
});

// The list of invalid argument types to test, with an f32 control case.
const kArgumentTypes = objectsToRecord([
TypeF32,
...kAllConcreteIntegerScalarsAndVectors,
...kAllF16ScalarsAndVectors,
TypeMat(2, 2, TypeF32)]
);

g.test('invalid_argument_types').
specURL('https://www.w3.org/TR/WGSL/#derivative-builtin-functions').
desc(
  `
Derivative builtins only accept f32 scalar and vector types.
`
).
params((u) =>
u.combine('type', keysOf(kArgumentTypes)).combine('call', ['', ...kDerivativeBuiltins])
).
beforeAllSubcases((t) => {
  if (elementType(kArgumentTypes[t.params.type]) === TypeF16) {
    t.selectDeviceOrSkipTestCase('shader-f16');
  }
}).
fn((t) => {
  const type = kArgumentTypes[t.params.type];
  const code = `
${elementType(kArgumentTypes[t.params.type]) === TypeF16 ? 'enable f16;' : ''}

fn foo() {
  let x: ${type.toString()} = ${t.params.call}(${type.create(1).wgsl()});
}`;
  t.expectCompileResult(kArgumentTypes[t.params.type] === TypeF32 || t.params.call === '', code);
});
//# sourceMappingURL=derivatives.spec.js.map