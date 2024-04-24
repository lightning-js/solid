/* eslint-disable @typescript-eslint/unbound-method */
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

import { createRenderer } from 'solid-js/universal';
import { config } from '../config.js';
import { startLightningRenderer } from './lightningInit.js';
import nodeOpts from './solidOpts.js';
import { type SolidNode } from './node/elementNode.js';
import { splitProps, createMemo, untrack, type JSX } from 'solid-js';
import type { RendererMain, RendererMainSettings } from '@lightningjs/renderer';

const solidRenderer = createRenderer<SolidNode>(nodeOpts);

let renderer: RendererMain;
export async function startLightning(
  options?: Partial<RendererMainSettings>,
  rootId?: string | HTMLElement,
) {
  renderer = startLightningRenderer(
    options || config.rendererOptions,
    rootId || 'app',
  );
  return await renderer.init();
}

export const render = async function (
  code: () => JSX.Element,
  node?: HTMLElement | string,
) {
  const rootNode = nodeOpts.createElement('App');

  await startLightning(undefined, node);
  rootNode.lng = renderer.root!;
  // @ts-expect-error - code is jsx element and not SolidElement yet
  const dispose = solidRenderer.render(code, rootNode);
  return {
    dispose,
    rootNode,
    renderer,
  };
};

// used for playground - must be sync so user must await startLightning
export const renderSync = function (code: () => JSX.Element) {
  const rootNode = nodeOpts.createElement('App');
  rootNode.lng = renderer.root!;
  // @ts-expect-error - code is jsx element and not SolidElement yet
  return solidRenderer.render(code, rootNode);
};

export const {
  effect,
  memo,
  createComponent,
  createElement,
  createTextNode,
  insertNode,
  insert,
  spread,
  setProp,
  mergeProps,
  use,
} = solidRenderer;

/**
 * renders an arbitrary custom or native component and passes the other props
 * ```typescript
 * <Dynamic component={multiline() ? 'textarea' : 'input'} value={value()} />
 * ```
 * @description https://www.solidjs.com/docs/latest/api#dynamic
 */
export function Dynamic<T>(
  props: T extends Record<any, any> ? T : never,
): SolidNode {
  const [p, others] = splitProps(props, ['component']);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const cached = createMemo<Function | string>(() => p.component);
  return createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case 'function':
        return untrack(() => component(others));

      case 'string':
        // eslint-disable-next-line no-case-declarations
        const el = createElement(component);
        spread(el, others);
        return el;

      default:
        break;
    }
  }) as unknown as SolidNode;
}
