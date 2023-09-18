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

import { createEffect } from 'solid-js';
import universalLightning from './lightning';

const injectCSS = (css) => {
  const el = document.createElement('style');
  el.innerText = css;
  document.head.appendChild(el);
};

const updateRootStyleFromCanvas = function (bcr) {
  //const p = self.stage.getRenderPrecision() / self.stage.getOption('devicePixelRatio');
  const p = 0.6666667;
  const root = document.getElementById('inspector');
  root.style.left = bcr.left + 'px';
  root.style.top = bcr.top + 'px';
  root.style.width = Math.ceil(bcr.width / p) + 'px';
  root.style.height = Math.ceil(bcr.height / p) + 'px';
  root.style.transformOrigin = '0 0 0';
  root.style.transform = 'scale(' + p + ',' + p + ')';
};

export function attachInspector() {
  injectCSS(`
    #inspector {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      zIndex: 5;
      overflow: hidden;
    }
    div {
      position: absolute;
      display: inline-block;
    }
    .text {
      visibility: hidden;
    }
  `);

  const dom = document.createElement('div');
  dom.id = 'inspector';
  document.body.appendChild(dom);

  setTimeout(function () {
    const c = document.getElementsByTagName('canvas')[0];
    updateRootStyleFromCanvas(c.getBoundingClientRect());
  }, 1000);
}

export default {
  ...universalLightning,
  createElement(name) {
    let dom;
    if (name === 'canvas') {
      dom = document.getElementById('inspector');
    } else {
      dom = document.createElement('div');
    }

    if (name === 'text') {
      dom.classList.add('text');
    }
    const node = universalLightning.createElement(name);
    createEffect(() => {
      if (node.id) {
        dom.id = node.id;
      }
      dom.style.width = node.width + 'px';
      dom.style.height = node.height + 'px';
      dom.style.top = node.y + 'px';
      dom.style.left = node.x + 'px';
      dom.style.zIndex = node.zIndex;
    });
    node._dom = dom;
    dom.solid = node;
    return node;
  },
  createTextNode(text) {
    const dom = document.createTextNode(text);
    const node = universalLightning.createTextNode(text);
    node._dom = dom;
    return node;
  },
  replaceText(textNode, value) {
    universalLightning.replaceText(textNode, value);
    textNode._dom.data = value;
  },
  insertNode(parent, node, anchor) {
    if (parent) {
      if (anchor) {
        parent._dom.insertBefore(node._dom, anchor._dom);
      } else {
        parent._dom.appendChild(node._dom);
      }
      universalLightning.insertNode(parent, node, anchor);
    }
  },
  removeNode(parent, node) {
    parent._dom.removeChild(node._dom);
    universalLightning.removeNode(parent, node);
  },
};
