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

import { createEffect } from "solid-js";
import { startLightningRenderer, type SolidRendererOptions } from '../core/renderer/index.js';
import type { RendererMain } from "@lightningjs/renderer";
import { assertTruthy } from "@lightningjs/renderer/utils";
import { ElementNode, type SolidNode } from "../core/node/index.js";

export let renderer: RendererMain;
export let createShader: RendererMain['createShader'];

function renderTopDown(node: SolidNode) {
  if (node.name === 'TextNode') {
    return;
  }
  assertTruthy(node instanceof ElementNode);
  node.render();
  node.children.forEach(c => renderTopDown(c))
}

export interface CanvasOptions {
  coreExtensionModule?: string,
  threadXCoreWorkerUrl?: string,
}

export interface CanvasProps {
  options?: SolidRendererOptions;
  children?: any;
}

export const Canvas = (props: CanvasProps) => {
  const options = props.options || {};
  renderer = startLightningRenderer(options);
  createShader = renderer.createShader.bind(renderer);
  const init = renderer.init();
  let root: ElementNode | undefined;

  createEffect(() => {
    init.then(() => {
      assertTruthy(root);
      root.lng = renderer.root;
      root.children.forEach(renderTopDown)
    }).catch(console.error);
  })
  return (
    <canvas ref={root} zIndex={0.1}>
      {props.children}
    </canvas>
  )
};
