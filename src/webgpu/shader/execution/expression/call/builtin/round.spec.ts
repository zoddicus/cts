export const description = `
Execution tests for the 'round' builtin function
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../../gpu_test.js';

export const g = makeTestGroup(GPUTest);

g.test('abstract_float')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(
    `
T is AbstractFloat, f32, f16, vecN<AbstractFloat>, vecN<f32>, or vecN<f16>
@const fn round(e: T ) -> T
Result is the integer k nearest to e, as a floating point value.
When e lies halfway between integers k and k+1, the result is k when k is even,
and k+1 when k is odd.
Component-wise when T is a vector.
`
  )
  .params(u =>
    u
      .combine('storageClass', ['uniform', 'storage_r', 'storage_rw'] as const)
      .combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();

g.test('f32')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(
    `
T is AbstractFloat, f32, f16, vecN<AbstractFloat>, vecN<f32>, or vecN<f16>
@const fn round(e: T ) -> T
Result is the integer k nearest to e, as a floating point value.
When e lies halfway between integers k and k+1, the result is k when k is even,
and k+1 when k is odd.
Component-wise when T is a vector.
`
  )
  .params(u =>
    u
      .combine('storageClass', ['uniform', 'storage_r', 'storage_rw'] as const)
      .combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();

g.test('f16')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(
    `
T is AbstractFloat, f32, f16, vecN<AbstractFloat>, vecN<f32>, or vecN<f16>
@const fn round(e: T ) -> T
Result is the integer k nearest to e, as a floating point value.
When e lies halfway between integers k and k+1, the result is k when k is even,
and k+1 when k is odd.
Component-wise when T is a vector.
`
  )
  .params(u =>
    u
      .combine('storageClass', ['uniform', 'storage_r', 'storage_rw'] as const)
      .combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();