/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { assertTruthy } from '@lightningjs/renderer/utils';
import type { ElementNode, SolidNode } from './node/index.js';

export default function (node: ElementNode): boolean {
  const children = [];
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i]!;
    // Filter empty text nodes which are place holders for <Show> and elements missing dimensions
    if (c.name === 'TextNode') {
      continue;
    }
    // text node hasnt loaded yet - skip layout
    if (c.name === 'text' && c.text !== '' && !(c.width || c.height)) {
      return false;
    }

    children.push(c);
  }

  const numChildren = children.length;
  const direction = node.flexDirection || 'row';
  const isRow = direction === 'row';
  const dimension = isRow ? 'width' : 'height';
  const crossDimension = isRow ? 'height' : 'width';
  const marginOne = isRow ? 'marginLeft' : 'marginTop';
  const marginTwo = isRow ? 'marginRight' : 'marginBottom';
  const prop = isRow ? 'x' : 'y';
  const crossProp = isRow ? 'y' : 'x';
  const containerSize = node[dimension] || 0;
  const containerCrossSize = node[crossDimension] || 0;
  const gap = node.gap || 0;
  const justify = node.justifyContent || 'flexStart';
  const align = node.alignItems;
  let itemSize = 0;
  if (['center', 'spaceBetween', 'spaceEvenly'].includes(justify)) {
    itemSize = children.reduce((prev, c) => prev + (c[dimension] || 0), 0);
  }

  // Only align children if container has a cross size
  const crossAlignChild =
    containerCrossSize && align
      ? (c: SolidNode) => {
          if (align === 'flexStart') {
            c[crossProp] = 0;
          } else if (align === 'center') {
            c[crossProp] = (containerCrossSize - (c[crossDimension] || 0)) / 2;
          } else if (align === 'flexEnd') {
            c[crossProp] = containerCrossSize - (c[crossDimension] || 0);
          }
        }
      : (c: SolidNode) => c;

  if (justify === 'flexStart') {
    let start = 0;
    children.forEach((c) => {
      c[prop] = start + (c[marginOne] || 0);
      start +=
        (c[dimension] || 0) + gap + (c[marginOne] || 0) + (c[marginTwo] || 0);
      crossAlignChild(c);
    });
    // Update container size
    if (node._autosized) {
      const calculatedSize = start - gap;
      if (calculatedSize !== node[dimension]) {
        node[dimension] = calculatedSize;
        return true;
      }
    }
  } else if (justify === 'flexEnd') {
    let start = containerSize;
    for (let i = numChildren - 1; i >= 0; i--) {
      const c = children[i];
      assertTruthy(c);
      c[prop] = start - (c[dimension] || 0) - (c[marginTwo] || 0);
      start -=
        (c[dimension] || 0) + gap + (c[marginOne] || 0) + (c[marginTwo] || 0);
      crossAlignChild(c);
    }
  } else if (justify === 'center') {
    let start = (containerSize - (itemSize + gap * (numChildren - 1))) / 2;
    children.forEach((c) => {
      c[prop] = start;
      start += (c[dimension] || 0) + gap;
      crossAlignChild(c);
    });
  } else if (justify === 'spaceBetween') {
    const toPad = (containerSize - itemSize) / (numChildren - 1);
    let start = 0;
    children.forEach((c) => {
      c[prop] = start;
      start += (c[dimension] || 0) + toPad;
      crossAlignChild(c);
    });
  } else if (justify === 'spaceEvenly') {
    const toPad = (containerSize - itemSize) / (numChildren + 1);
    let start = toPad;
    children.forEach((c) => {
      c[prop] = start;
      start += (c[dimension] || 0) + toPad;
      crossAlignChild(c);
    });
  }

  // Container was not updated
  return false;
}
