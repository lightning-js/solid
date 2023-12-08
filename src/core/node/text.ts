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

import BaseNode from './base.js';
import {
  type IntrinsicCommonProps,
  type NodeStyles,
  type TextStyles,
} from '../../index.js';
import calculateFlex from '../flex.js';
import {
  log,
  isArray,
  isNumber,
  isFunc,
  keyExists,
  getAnimatableValue,
} from '../utils.js';
import { config } from '../../config.js';
import { setActiveElement } from '../activeElement.js';
import type {
  INode,
  INodeAnimatableProps,
  INodeWritableProps,
  ShaderRef,
  Dimensions,
  AnimationSettings,
  NodeLoadedPayload,
} from '@lightningjs/renderer';
import { assertTruthy } from '@lightningjs/renderer/utils';

const LightningRendererNumberProps = [
  'alpha',
  'color',
  'colorTop',
  'colorRight',
  'colorLeft',
  'colorBottom',
  'colorTl',
  'colorTr',
  'colorBl',
  'colorBr',
  'height',
  'fontSize',
  'lineHeight',
  'mount',
  'mountX',
  'mountY',
  'pivot',
  'pivotX',
  'pivotY',
  'rotation',
  'scale',
  'width',
  'worldX',
  'worldY',
  'x',
  'y',
  'zIndex',
  'zIndexLocked',
];

const LightningRendererNonAnimatingProps = [
  'clipping',
  'contain',
  'fontFamily',
  'src',
  'text',
  'textAlign',
  'texture',
];

export interface TextNode extends BaseNode {
  name: string;
  text: string;
  parent: ElementNode | null;
  zIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  maxLines?: number;
  fontSize?: number;
  lineHeight?: number;
  /**
   * Managed by dom-inspector
   */
  _dom?: Text; // Public but uses _ prefix
}

export type SolidNode = ElementNode | TextNode;
export type SolidStyles = NodeStyles | TextStyles;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface ElementNode
  extends Partial<Omit<INodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class TextNode extends BaseNode {
  constructor() {
    super('TextNode');
  }

  _resizeOnTextLoad() {
    this.lng!.once(
      'loaded',
      (_node: INode, loadedPayload: NodeLoadedPayload) => {
        if (loadedPayload.type === 'text') {
          const { dimensions } = loadedPayload;

          this.width = dimensions.width;
          this.height = dimensions.height;
          this.parent!.updateLayout(this, dimensions);
        }
      },
    );
  }

  getText() {
    return this.children.map((c) => c.text).join('');
  }


  set style(value: TextStyles) {
    // Keys set in JSX are more important
    if (!this[key as keyof SolidStyles]) {
      this[key as keyof SolidStyles] = value[key as keyof SolidStyles];
    }
    this._style = value;
  }

  get style(): TextStyles {
    return this._style!;
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  set maxLines(maxLines: number) {
    this._maxLines = maxLines;
    this.height = maxLines * (this.lineHeight || this.fontSize || 0);
  }

  get maxLines(): number {
    return this._maxLines || 0;
  }

  updateLayout(child?: ElementNode, dimensions?: Dimensions) {
    if (this.hasChildren) {
      log('Layout: ', this);
      isFunc(this.onBeforeLayout) &&
        this.onBeforeLayout.call(this, child, dimensions);

      if (this.display === 'flex') {
        calculateFlex(this);
      }

      isFunc(this.onLayout) && this.onLayout.call(this, child, dimensions);
    }
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const node = this;
    const parent = this.parent!;


    if (this.states.length) {
      this._stateChanged();
    }

    let props = node._renderProps;

    if (parent.lng) {
      props.parent = parent.lng;
    }

    props = {
      ...config.fontSettings,
      ...props,
      text: node.getText(),
    };
    log('Rendering: ', this, props);
    node.lng = renderer.createTextNode(props);

    isFunc(this.onCreate) && this.onCreate.call(this, node);

    if (isFunc(node.onLoad)) {
      node.lng.on('loaded', node.onLoad);
    }

    if (!node.width || !node.height) {
      node._autosized = true;
      node._resizeOnTextLoad();
    }

    node.rendered = true;
    node.autofocus && node.setFocus();
    // clean up after first render;
    delete this._renderProps;
  }
}
