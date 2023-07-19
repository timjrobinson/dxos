//
// Copyright 2023 DXOS.org
//

import { Density } from '@dxos/aurora-types';

export const coarseBlockSize = 'min-bs-[40px]';
export const coarseTextPadding = 'pli-3';
export const coarseButtonPadding = 'pli-4';
export const coarseDimensions = `${coarseBlockSize} ${coarseTextPadding}`;
export const coarseButtonDimensions = `${coarseBlockSize} ${coarseButtonPadding}`;
export const fineBlockSize = 'min-bs-[40px] pointer-fine:min-bs-[32px]';
export const fineTextPadding = 'pli-2';
export const fineButtonPadding = 'pli-2.5';
export const fineDimensions = `${fineBlockSize} ${fineTextPadding}`;
export const fineButtonDimensions = `${fineBlockSize} ${fineButtonPadding}`;
export const densityBlockSize = (density: Density = 'coarse') => (density === 'fine' ? fineBlockSize : coarseBlockSize);
