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

import { isArray, isString } from '../utils.js';
import type SolidNode from './index.js';
export default class States extends Array {
  private _node: SolidNode;

  constructor(node: SolidNode, initialState: string[] | string | Record<string, unknown> = []) {
    if (isArray(initialState)) {
      super(...initialState as any);
    } else if (isString(initialState)) {
      super(initialState as any);
    } else {
      super(
        ...(Object.entries(initialState)
          .filter(([key, value]) => value)
          .map(([key]) => key) as any),
      );
    }

    this._node = node;
    return this;
  }

  has(state: string) {
    return this.indexOf(state) >= 0;
  }

  is(state: string) {
    return this.indexOf(state) >= 0;
  }

  add(state: string) {
    this.push(state);
    this._node._stateChanged();
  }

  toggle(state: string) {
    if (this.has(state)) {
      this.remove(state);
    } else {
      this.add(state);
    }
  }

  remove(state: string) {
    const stateIndexToRemove = this.indexOf(state);
    if (stateIndexToRemove >= 0) {
      this.splice(stateIndexToRemove, 1);
      this._node._stateChanged();
    }
  }
}
