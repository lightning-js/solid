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

import {
  MainCoreDriver,
  RendererMain,
  type RendererMainSettings,
} from '@lightningjs/renderer';

export let renderer: RendererMain;
export let createShader: RendererMain['createShader'];

export interface SolidRendererOptions extends RendererMainSettings {
  threadXCoreWorkerUrl?: string;
  rootId: string | HTMLElement;
}

export function startLightningRenderer(
  options: Partial<SolidRendererOptions> = {},
  rootId: string | HTMLElement = 'app',
): RendererMain {
  const driver = new MainCoreDriver();
  renderer = new RendererMain(options, rootId, driver);
  createShader = renderer.createShader.bind(renderer);
  return renderer;
}
