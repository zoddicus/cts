/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/export const description = `
Validation tests for matrix addition and subtraction expressions.
`;import { makeTestGroup } from '../../../../../common/framework/test_group.js';
import { keysOf } from '../../../../../common/util/data_tables.js';
import { ShaderValidationTest } from '../../shader_validation_test.js';

export const g = makeTestGroup(ShaderValidationTest);

// A list of operators
const kOperators = {
  add: { op: '+' },
  sub: { op: '-' }
};








const kTests = {
  bool: {
    src: 'false'
  },
  vec: {
    src: 'vec2()'
  },
  i32: {
    src: '1i'
  },
  u32: {
    src: '1u'
  },
  ai: {
    src: '1'
  },
  f32: {
    src: '1f'
  },
  f16: {
    src: '1h',
    is_f16: true
  },
  af: {
    src: '1.0'
  },
  texture: {
    src: 't'
  },
  sampler: {
    src: 's'
  },
  atomic: {
    src: 'a'
  },
  struct: {
    src: 'str'
  },
  array: {
    src: 'arr'
  },
  matf_ai_matching: {
    src: 'mat2x4(0, 0, 0, 0, 0, 0, 0, 0)'
  },
  matf_ai_no_matching: {
    src: 'mat2x2(0, 0, 0, 0)'
  },
  matf_size_matching: {
    src: 'mat2x3f()'
  },
  matf_size_no_match: {
    src: 'mat4x4f()'
  },
  math_size_matching: {
    src: 'mat2x3h()',
    is_f16: true
  },
  math_size_no_matching: {
    src: 'mat4x4h()',
    is_f16: true
  }
};

g.test('invalid').
desc(`Validates that add and subtract are valid if the matrix types match`).
params((u) =>
u.
combine('op', keysOf(kOperators)).
combine('rhs', ['ai', 'mat2x3f()', 'mat2x3h()']).
combine('test', keysOf(kTests))
).
beforeAllSubcases((t) => {
  if (kTests[t.params.test].is_f16 === true || t.params.rhs.startsWith('mat2x3h(')) {
    t.selectDeviceOrSkipTestCase('shader-f16');
  }
}).
fn((t) => {
  const lhs = kTests[t.params.test].src;
  const rhs = t.params.rhs === 'ai' ? 'mat2x4(0, 0, 0, 0, 0, 0, 0, 0)' : t.params.rhs;

  const code = `
${kTests[t.params.test].is_f16 || t.params.rhs.startsWith('mat2x3h(') ? 'enable f16;' : ''}
@group(0) @binding(0) var t : texture_2d<f32>;
@group(0) @binding(1) var s : sampler;
@group(0) @binding(2) var<storage, read_write> a : atomic<i32>;

struct S { u : u32 }

var<private> arr : array<u32, 4>;
var<private> str : S;

@compute @workgroup_size(1)
fn main() {
  let foo = ${lhs} ${kOperators[t.params.op].op} ${rhs};
}
`;

  t.expectCompileResult(lhs === rhs, code);
});

g.test('with_abstract').
desc(`Validates that add and subtract are valid if when done against an abstract`).
params((u) =>
u.
combine('op', keysOf(kOperators)).
combine('rhs', ['mat2x3f()', 'mat2x3h()']).
combine('swap', [true, false])
).
beforeAllSubcases((t) => {
  if (t.params.rhs.startsWith('mat2x3h(')) {
    t.selectDeviceOrSkipTestCase('shader-f16');
  }
}).
fn((t) => {
  let lhs = 'mat2x3(0, 0, 0, 0, 0, 0)';
  let rhs = t.params.rhs;

  if (t.params.swap) {
    const a = lhs;
    lhs = rhs;
    rhs = a;
  }

  const code = `
${t.params.rhs.startsWith('mat2x3h(') ? 'enable f16;' : ''}
@group(0) @binding(0) var t : texture_2d<f32>;
@group(0) @binding(1) var s : sampler;
@group(0) @binding(2) var<storage, read_write> a : atomic<i32>;

struct S { u : u32 }

var<private> arr : array<u32, 4>;
var<private> str : S;

@compute @workgroup_size(1)
fn main() {
  let foo = ${lhs} ${kOperators[t.params.op].op} ${rhs};
}
`;

  t.expectCompileResult(true, code);
});