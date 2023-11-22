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

export type NodeStates = string[] | string | Record<string, boolean>;

export default class States extends Array<string> {
  private onChange: () => void;

  constructor(callback: () => void, initialState: NodeStates = {}) {
    if (isArray(initialState)) {
      super(...initialState);
    } else if (isString(initialState)) {
      super(initialState);
    } else {
      super(
        ...Object.entries(initialState)
          .filter(([_key, value]) => value)
          .map(([key]) => key),
      );
    }

    this.onChange = callback;
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
    this.onChange();
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
      this.onChange();
    }
  }
}
