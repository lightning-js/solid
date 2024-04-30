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

import { type VNode, createRenderer } from '@vue/runtime-core';
import nodeOps from './vueOps.js';
import { extend } from '@vue/shared';
import { Config, startLightningRenderer } from '@lightningjs/core';
const patchProp = nodeOps.setProperty;

export const createApp = async function (
  code: VNode,
  node?: string | HTMLElement | undefined,
) {
  const renderer = startLightningRenderer(Config.rendererOptions, node);
  await renderer.init();
  const rootNode = nodeOps.createElement('App');
  rootNode.lng = renderer.root!;
  baseCreateApp(code).mount(rootNode);
  return {
    rootNode,
    renderer,
  };
};

const { render, createApp: baseCreateApp } = createRenderer(
  extend({ patchProp }, nodeOps),
);

export { render };
export * from './vueOps.js';
export * from '@vue/runtime-core';
