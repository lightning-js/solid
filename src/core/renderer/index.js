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
  ThreadXRenderDriver,
} from '@lightningjs/renderer';
import coreWorkerUrl from './worker.js?importChunkUrl';

const defaultOptions = {
  driver: 'main',
  width: 1920,
  height: 1080,
  deviceLogicalPixelRatio: 0.6666667,
  devicePhysicalPixelRatio: 1,
  rootId: 'app',
};

export default (options = {}) => {
  let driver;
  options = {
    ...defaultOptions,
    ...options,
  };

  if (options.driver === 'main') {
    driver = new MainRenderDriver();
  } else {
    driver = new ThreadXRenderDriver({ coreWorkerUrl });
  }

  return new RendererMain(options, options.rootId, driver);
};
