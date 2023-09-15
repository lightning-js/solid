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
import startLightningRenderer from './renderer';
import Node from './node';
import universalLightning from './universal/lightning';
import universalInspector from './universal/dom-inspector';

const loadInspector = import.meta.env.MODE === 'development';
const solidRenderer = createRenderer(
  loadInspector ? universalInspector : universalLightning,
);
export const {
  render,
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

export let renderer;
export let makeShader;

export const Render = function (App, options = {}) {
  renderer = startLightningRenderer({
    width: 1920,
    height: 1080,
    ...options,
  });

  renderer.init().then(() => {
    const rootNode = new Node('App', renderer.root);

    if (loadInspector) {
      const dom = document.createElement('div');
      dom.id = 'inspector';
      rootNode._dom = dom;
      dom.solid = rootNode;
      document.body.appendChild(rootNode._dom);
    }

    rootNode.zIndex = 0.1;
    makeShader = renderer.makeShader;
    render(App, rootNode);
  });
};
