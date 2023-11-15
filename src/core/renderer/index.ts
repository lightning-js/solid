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
  MainRenderDriver,
  RendererMain,
  type RendererMainSettings,
} from '@lightningjs/renderer';

export let renderer: RendererMain;
export let createShader: RendererMain['createShader'];

export interface SolidRendererOptions extends RendererMainSettings {
  threadXCoreWorkerUrl?: string;
  rootId: string | HTMLElement;
}

const defaultOptions: SolidRendererOptions = {
  appWidth: 1920,
  appHeight: 1080,
  deviceLogicalPixelRatio: 0.6666667,
  devicePhysicalPixelRatio: 1,
  rootId: 'app',
  threadXCoreWorkerUrl: undefined,
};

export function startLightningRenderer(
  options: Partial<SolidRendererOptions> = {},
): RendererMain {
  const driver = new MainRenderDriver();
  const resolvedOptions: SolidRendererOptions = {
    ...defaultOptions,
    ...options,
  };

  renderer = new RendererMain(
    {
      appWidth: resolvedOptions.appWidth,
      appHeight: resolvedOptions.appHeight,
      deviceLogicalPixelRatio: resolvedOptions.deviceLogicalPixelRatio,
      devicePhysicalPixelRatio: resolvedOptions.devicePhysicalPixelRatio,
      clearColor: resolvedOptions.clearColor,
      coreExtensionModule: resolvedOptions.coreExtensionModule,
    },
    resolvedOptions.rootId,
    driver,
  );

  createShader = renderer.createShader.bind(renderer);
  return renderer;
}
