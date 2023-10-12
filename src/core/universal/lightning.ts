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
import { assertTruthy } from '@lightningjs/renderer/utils';
import { renderer } from '../../index.js';
import { createEffect } from 'solid-js';
import { log } from '../utils.js';
import { ElementNode, type SolidNode, type TextNode } from '../node/index.js';

export default {
  createElement(name: string): ElementNode {
    const node = new ElementNode(name);
    renderer.root && createEffect(() => node.render());
    return node;
  },
  createTextNode(text: string): TextNode {
    // A text node is just a string - not the <text> node
    return { name: 'TextNode', text };
  },
  replaceText(node: TextNode, value: string): void {
    log('Replace Text: ', node, value);
    node.text = value;
    const parent = node.parent;
    assertTruthy(parent);
    parent._autosized && parent._resizeOnTextLoad();
    parent.text = parent.getText();
  },
  setProperty(node: ElementNode, name: string, value: any = true): void {
    if (name === 'animate') {
      node._animate = value as boolean;
      return;
    }
    // @ts-expect-error Assignment type is difficult to do here. Fix later.
    node[name] = value;
  },
  insertNode(parent: ElementNode, node: SolidNode, anchor: SolidNode): void {
    log('INSERT: ', parent, node, anchor);
    if (parent) {
      parent.children.insert(node, anchor);

      if (node.name === 'TextNode') {
        if (!parent.isTextNode()) {
          console.error(
            'Inserting text outside of a <Text> node is not allowed',
          );
        }
        parent._autosized && parent._resizeOnTextLoad();
        parent.text = parent.getText();
      }
    }
  },
  isTextNode(node: ElementNode): boolean {
    return node.isTextNode();
  },
  removeNode(parent: ElementNode, node: SolidNode): void {
    log('REMOVE: ', parent, node);
    parent.children.remove(node);
    if (node instanceof ElementNode) {
      node.destroy();
    }
  },
  getParentNode(node: SolidNode): ElementNode | undefined {
    return node.parent;
  },
  getFirstChild(node: ElementNode): SolidNode | undefined {
    return node.children[0];
  },
  getNextSibling(node: SolidNode): SolidNode | undefined {
    if (node.parent) {
      const children = node.parent.children || [];
      const index = children.indexOf(node) + 1;
      if (index < children.length) {
        return children[index];
      }
    }
    return undefined;
  },
};
