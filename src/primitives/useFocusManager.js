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

import { createEffect, on, createSignal, untrack } from 'solid-js';
import { createSingletonRoot } from '@solid-primitives/rootless';
import { useKeyDownEvent } from '@solid-primitives/keyboard';
import { activeElement } from '../core/activeElement';
import { isFunc } from '../core/utils';
import { config } from '../config';

const { keyMap } = config;

const [focusPath, setFocusPath] = createSignal([]);
export const useFocusManager = createSingletonRoot(() => {
  const keypressEvent = useKeyDownEvent();

  createEffect(
    on(
      activeElement,
      (currentFocusedElm, prevFocusedElm, prevFocusPath = []) => {
        const newFocusedElms = [];
        let current = currentFocusedElm;

        const fp = [];
        while (current) {
          if (!current.states.has('focus')) {
            current.states.add('focus');
            isFunc(current.onFocus) &&
              current.onFocus.call(current, currentFocusedElm, prevFocusedElm);

            newFocusedElms.push(current);
          }
          fp.push(current);
          current = current.parent;
        }

        prevFocusPath.forEach((elm) => {
          if (!fp.includes(elm)) {
            elm.states.remove('focus');
            isFunc(elm.onBlur) &&
              elm.onBlur.call(elm, currentFocusedElm, prevFocusedElm);
          }
        });

        setFocusPath(fp);
        return fp;
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const e = keypressEvent();

    if (e) {
      const key = keyMap[e.key] || e.key;
      untrack(() => {
        const fp = focusPath();
        for (const elm of fp) {
          if (isFunc(elm[`on${key}`])) {
            if (elm[`on${key}`].call(elm, e, elm) === true) {
              break;
            }
          }

          if (isFunc(elm.onKeyPress)) {
            if (elm.onKeyPress.call(elm, e, key, elm) === true) {
              break;
            }
          }
        }
        return false;
      });
    }
  });

  return focusPath;
});
