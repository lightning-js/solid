/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2023 Comcast
 *
 * Licensed under the Apache License, Version 2.0 (the License);
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
 */

import type {
  AnimationSettings,
  RendererMainSettings,
} from '@lightningjs/renderer';
import type { IntrinsicTextNodeStyleProps } from './intrinsicTypes.js';

interface Config {
  debug: boolean;
  animationSettings: Partial<AnimationSettings>;
  animationsEnabled: boolean;
  fontSettings: Partial<IntrinsicTextNodeStyleProps>;
  rendererOptions?: Partial<RendererMainSettings>;
}

function isDevEnv(): boolean {
  return !!(import.meta.env && import.meta.env.DEV);
}
export const isDev = isDevEnv() || false;

export const config: Config = {
  debug: false,
  animationsEnabled: true,
  animationSettings: {
    duration: 250,
    easing: 'ease-in-out',
  },
  fontSettings: {
    fontFamily: 'Ubuntu',
    fontSize: 100,
  },
};
