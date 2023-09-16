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
import universalLightning from './universal/lightning';
import universalInspector, { attachInspector } from './universal/dom-inspector';

const loadInspector = import.meta.env.MODE === 'development';
if (loadInspector) {
  attachInspector();
}
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
