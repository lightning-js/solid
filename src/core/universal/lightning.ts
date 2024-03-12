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
import { renderer } from '../renderer/index.js';
import { onMount } from 'solid-js';
import { log } from '../utils.js';
import { config } from '../../config.js';
import { ElementNode, type SolidNode, type TextNode } from '../node/index.js';
import type { createRenderer } from 'solid-js/universal';

export type SolidRendererOptions = Parameters<
  typeof createRenderer<SolidNode>
>[0];

/**
 * Recursively removes all child nodes from the given element node and destroys the node itself.
 *
 * @param {SolidNode} node - the node
 * @return {void}
 */
function removeChildrenNode(node: SolidNode) {
  if (node instanceof ElementNode) {
    for (const children of node.children ?? []) {
      removeChildrenNode(children);
    }
    node.destroy();
  }
}

export default {
  createElement(name: string): ElementNode {
    const node = new ElementNode(name);
    return node;
  },
  createTextNode(text: string): TextNode {
    // A text node is just a string - not the <text> node
    return { name: 'TextNode', text, parent: undefined };
  },
  replaceText(node: TextNode, value: string): void {
    log('Replace Text: ', node, value);
    node.text = value;
    const parent = node.parent;
    assertTruthy(parent);
    parent.text = parent.getText();
  },
  setProperty(node: ElementNode, name: string, value: any = true): void {
    node[name] = value;
  },
  insertNode(parent: ElementNode, node: SolidNode, anchor: SolidNode): void {
    log('INSERT: ', parent, node, anchor);
    if (parent) {
      parent.children.insert(node, anchor);

      if (node.name === 'TextNode') {
        // TextNodes can be placed outside of <text> nodes when <Show> is used as placeholder
        if (parent.isTextNode()) {
          parent.text = parent.getText();
        }
        return;
      }

      if (renderer.root && parent.rendered && (node as ElementNode).render) {
        (node as ElementNode).render();
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
      if (config.enableRecursiveRemoval) {
        removeChildrenNode(node);
      } else {
        // Solid replacesNodes to move them (via insert and remove),
        // so we need to wait for the next microtask to destroy the node
        // in the event it gets a new parent.
        node.destroy();
      }
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
} satisfies SolidRendererOptions;
