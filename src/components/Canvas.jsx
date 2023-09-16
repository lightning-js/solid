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
import startLightningRenderer from '../core/renderer';

export let renderer;
export let makeShader;

function renderTopDown(node) {
  if (node.name === 'TextNode') {
    return;
  }
  node.render();
  node.children.forEach(c => renderTopDown(c))
}

export const Canvas = (props) => {
  renderer = startLightningRenderer({
    width: 1920,
    height: 1080,
    ...props.options,
  });
  makeShader = renderer.makeShader;
  const init = renderer.init();
  let root;

  createEffect(() => {
    init.then(() => {
      root.lng = renderer.root;
      root.children.forEach(renderTopDown)
    });
  })
  return (
    <canvas ref={root} zIndex={0.1}>
      {props.children}
    </canvas>
  )
};

export default Canvas;
