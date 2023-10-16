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

import universalLightning from './lightning.js';
import { renderer } from '../renderer/index.js';
import type { ElementNode, SolidNode, TextNode } from '../node/index.js';

const injectCSS = (css: string) => {
  const el = document.createElement('style');
  el.innerText = css;
  document.head.appendChild(el);
};

const updateRootStyleFromCanvas = function (canvas: HTMLCanvasElement) {
  const bcr = canvas.getBoundingClientRect();
  const p = renderer.settings.deviceLogicalPixelRatio || 1; //0.6666667;
  const root = document.getElementById('linspector') as HTMLDivElement;
  root.style.left = canvas.offsetLeft + 'px';
  root.style.top = canvas.offsetTop + 'px';
  root.style.width = Math.ceil(bcr.width / p) + 'px';
  root.style.height = Math.ceil(bcr.height / p) + 'px';
  root.style.transformOrigin = '0 0 0';
  root.style.transform = 'scale(' + p + ',' + p + ')';
};

export function attachInspector() {
  injectCSS(`
    #linspector {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      zIndex: 5;
      overflow: hidden;
    }
    div.lnode {
      position: absolute;
      display: inline-block;
    }
    .ltext {
      visibility: hidden;
    }
  `);

  setTimeout(function () {
    // @ts-expect-error Remove when Renderer publicizes `canvas`
    updateRootStyleFromCanvas(renderer.canvas);
  }, 1000);
}

export default {
  ...universalLightning,
  createElement(name: string) {
    const dom = document.createElement('div');

    if (name === 'canvas') {
      dom.id = 'linspector';
      // @ts-expect-error Remove when Renderer publicizes `canvas`
      renderer.canvas.parentNode.appendChild(dom);
    } else {
      dom.classList.add('lnode');
    }

    if (name === 'text') {
      dom.classList.add('ltext');
    }
    const node = universalLightning.createElement(name);
    if (name !== 'canvas') {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const origRender = node.render;
      node.render = () => {
        origRender.call(node);
        if (node.id) {
          dom.id = node.id;
        }
        if (node.clipping) {
          dom.style.overflow = 'hidden';
        }
        dom.style.width = node.width + 'px';
        dom.style.height = node.height + 'px';
        dom.style.top = node.y + 'px';
        dom.style.left = node.x + 'px';
        dom.style.zIndex = `${node.zIndex}`;
      };
    }
    node._dom = dom;
    // TODO: WeakMap might be a good idea instead augmenting properties onto HTMLDivElement
    (dom as any).solid = node;
    return node;
  },
  setProperty(node: ElementNode, name: string, value: any = true): void {
    if (name === 'width') {
      node._dom!.style.width = value + 'px';
    } else if (name === 'height') {
      node._dom!.style.height = value + 'px';
    } else if (name === 'y') {
      node._dom!.style.top = value + 'px';
    } else if (name === 'x') {
      node._dom!.style.left = value + 'px';
    } else if (name === 'zIndex') {
      node._dom!.style.zIndex = value;
    }
    universalLightning.setProperty(node, name, value);
  },
  createTextNode(text: string): TextNode {
    const dom = document.createTextNode(text);
    const node = universalLightning.createTextNode(text);
    node._dom = dom;
    return node;
  },
  replaceText(textNode: TextNode, value: string): void {
    universalLightning.replaceText(textNode, value);
    textNode._dom!.data = value;
  },
  insertNode(parent: ElementNode, node: SolidNode, anchor: SolidNode): void {
    if (parent) {
      if (anchor && parent._dom === anchor._dom!.parentNode) {
        parent._dom.insertBefore(node._dom!, anchor._dom!);
      } else {
        parent._dom!.appendChild(node._dom!);
      }
      universalLightning.insertNode(parent, node, anchor);
    }
  },
  removeNode(parent: ElementNode, node: SolidNode): void {
    parent._dom!.removeChild(node._dom!);
    universalLightning.removeNode(parent, node);
  },
};
