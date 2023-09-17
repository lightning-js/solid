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

import { renderer } from '../../';
import { createEffect } from 'solid-js';
import { log } from '../utils';
import Node from '../node';

export default {
  createElement(name) {
    log('Creating: ', name);
    const node = new Node(name);
    renderer.root && createEffect(() => node.render());
    return node;
  },
  createTextNode(text) {
    // A text node is just a string - not the <text> node
    return { name: 'TextNode', text };
  },
  replaceText(node, value) {
    log('Replace ', value);
    node.text = value;
    node.parent.text = value;
  },
  setProperty(node, name, value = true) {
    log('Set ', name, value);
    if (name === 'style') {
      // Keys set in JSX are more important
      for (let key in value) {
        if (key === 'animate') {
          key = '_animate';
        }
        if (!(node[key])) {
          node[key] = value[key];
        }
      }
    } else if (name === 'animate') {
      return (node._animate = value);
    }

    node[name] = value;
  },
  insertNode(parent, node, anchor) {
    log('INSERT: ', parent, node, anchor);
    if (parent) {
      parent.children.insert(node, anchor);

      if (node.name === 'TextNode') {
        if (!parent.isTextNode()) {
          console.error('Inserting text outside of a <Text> node is not allowed');
        }
        parent.text = parent.getText();
      }
    }
  },
  isTextNode(node) {
    return node.isTextNode();
  },
  removeNode(parent, node) {
    log('REMOVING: ', parent, node);
    parent.children.remove(node);
    node.destroy && node.destroy();
  },
  getParentNode(node) {
    return node.parent;
  },
  getFirstChild(node) {
    return node.children[0];
  },
  getNextSibling(node) {
    if (node.parent) {
      let children = node.parent.children || [];
      let index = children.indexOf(node) + 1;
      if (index < children.length) {
        return children[index];
      }
    }
    return null;
  },
};
