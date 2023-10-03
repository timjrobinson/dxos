//
// Copyright 2023 DXOS.org
//

import { CSS, Transform } from '@dnd-kit/utilities';

// https://docs.dndkit.com/api-documentation/draggable/usedraggable#transform
export const getTransformCSS = (transform: Transform | null) =>
  transform ? CSS.Transform.toString(Object.assign(transform, { scaleX: 1, scaleY: 1 })) : undefined;
