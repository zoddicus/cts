/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/export const description = `
Execution tests for the 'normalize' builtin function

T is AbstractFloat, f32, or f16
@const fn normalize(e: vecN<T> ) -> vecN<T>
Returns a unit vector in the same direction as e.
`;import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../../gpu_test.js';
import { TypeF32, TypeF16, TypeVec } from '../../../../../util/conversion.js';
import { FP } from '../../../../../util/floating_point.js';
import { makeCaseCache } from '../../case_cache.js';
import { allInputSources, run } from '../../expression.js';

import { builtin } from './builtin.js';

export const g = makeTestGroup(GPUTest);

// Cases: [f32|f16]_vecN_[non_]const
const cases = ['f32', 'f16'].
flatMap((trait) =>
[2, 3, 4].flatMap((dim) =>
[true, false].map((nonConst) => ({
  [`${trait}_vec${dim}_${nonConst ? 'non_const' : 'const'}`]: () => {
    return FP[trait].generateVectorToVectorCases(
      FP[trait].vectorRange(dim),
      nonConst ? 'unfiltered' : 'finite',
      FP[trait].normalizeInterval
    );
  }
}))
)
).
reduce((a, b) => ({ ...a, ...b }), {});

export const d = makeCaseCache('normalize', cases);

g.test('abstract_float').
specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions').
desc(`abstract float tests`).
params((u) =>
u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4])
).
unimplemented();

g.test('f32_vec2').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f32 tests using vec2s`).
params((u) => u.combine('inputSource', allInputSources)).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f32_vec2_const' : 'f32_vec2_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(2, TypeF32)], TypeVec(2, TypeF32), t.params, cases);
});

g.test('f32_vec3').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f32 tests using vec3s`).
params((u) => u.combine('inputSource', allInputSources)).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f32_vec3_const' : 'f32_vec3_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(3, TypeF32)], TypeVec(3, TypeF32), t.params, cases);
});

g.test('f32_vec4').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f32 tests using vec4s`).
params((u) => u.combine('inputSource', allInputSources)).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f32_vec4_const' : 'f32_vec4_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(4, TypeF32)], TypeVec(4, TypeF32), t.params, cases);
});

g.test('f16_vec2').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f16 tests using vec2s`).
params((u) => u.combine('inputSource', allInputSources)).
beforeAllSubcases((t) => {
  t.selectDeviceOrSkipTestCase('shader-f16');
}).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f16_vec2_const' : 'f16_vec2_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(2, TypeF16)], TypeVec(2, TypeF16), t.params, cases);
});

g.test('f16_vec3').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f16 tests using vec3s`).
params((u) => u.combine('inputSource', allInputSources)).
beforeAllSubcases((t) => {
  t.selectDeviceOrSkipTestCase('shader-f16');
}).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f16_vec3_const' : 'f16_vec3_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(3, TypeF16)], TypeVec(3, TypeF16), t.params, cases);
});

g.test('f16_vec4').
specURL('https://www.w3.org/TR/WGSL/#numeric-builtin-functions').
desc(`f16 tests using vec4s`).
params((u) => u.combine('inputSource', allInputSources)).
beforeAllSubcases((t) => {
  t.selectDeviceOrSkipTestCase('shader-f16');
}).
fn(async (t) => {
  const cases = await d.get(
    t.params.inputSource === 'const' ? 'f16_vec4_const' : 'f16_vec4_non_const'
  );
  await run(t, builtin('normalize'), [TypeVec(4, TypeF16)], TypeVec(4, TypeF16), t.params, cases);
});
//# sourceMappingURL=normalize.spec.js.map