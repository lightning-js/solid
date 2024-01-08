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

import type { SolidNode } from '../../types.js';

/**
 * Children class
 */
export default class Children<Node> extends Array<Node> {
  _parent: SolidNode;

  constructor(node: SolidNode) {
    super();
    this._parent = node;
  }

  get selected(): Node | undefined {
    // For selected Elements should always be an ElementNode
    return this[this._parent.selected || 0];
  }

  get firstChild(): Node | undefined {
    return this[0];
  }

  insert(node: Node, beforeNode: Node) {
    if (beforeNode) {
      const index = this.indexOf(beforeNode);
      this.splice(index, 0, node);
    } else {
      this.push(node);
    }

    node.parent = this._parent;
    this._parent._isDirty = true;
  }

  remove(node: Node) {
    const nodeIndexToRemove = this.indexOf(node);
    if (nodeIndexToRemove >= 0) {
      this.splice(nodeIndexToRemove, 1);
    }
  }
}
