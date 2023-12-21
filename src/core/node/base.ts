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

import { renderer } from '../renderer/index.js';
import {
  type IntrinsicCommonProps,
  type NodeStyles,
  type TextStyles,
} from '../../index.js';
import Children from './children.js';
import States, { type NodeStates } from './states.js';
import calculateFlex from '../flex.js';
import {
  log,
  isFunc,
  keyExists,
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
} from '@lightningjs/renderer';
import { assertTruthy } from '@lightningjs/renderer/utils';
import type { NodeStates } from './states.js';

export type SolidNode = ElementNode | TextNode;
export type SolidStyles = NodeStyles | TextStyles;

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface ElementNode
  extends Partial<Omit<INodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {
  [key: string]: unknown;
}

export default class BaseNode extends Object {
  lng: INode | null = null;
  selected: number;
  rendered: boolean;
  forwardStates?: boolean;
  autofocus: boolean;
  children: Children;
  style: SolidStyles;
  _undoStates: SolidStyles;
  _parent?: ElementNode | null;
  onBeforeLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  _states?: NodeStates;
  display?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  /**
   * Managed by dom-inspector
   */
  public _dom?: HTMLDivElement; // Public but uses _ prefix

  constructor() {
    this.selected = 0;
    this.rendered = false;
    this.autofocus = false;
    this.children = new Children(this);
  }

  setFocus() {
    if (this.rendered) {
      setActiveElement(this);
    } else {
      this.autofocus = true;
    }
  }

  get parent() {
    return this._parent;
  }

  set parent(p) {
    this._parent = p;
    if (this.rendered && this.lng) {
      this.lng.parent = p?.lng ?? null;
    }
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  destroy() {
    this.lng && renderer.destroyNode(this.lng);
  }

  set states(states: NodeStates) {
    this._states = new States(this._stateChanged.bind(this), states);
    if (this.rendered) {
      this._stateChanged();
    }
  }

  get states(): States {
    this._states = this._states || new States(this._stateChanged.bind(this));
    return this._states;
  }

  updateLayout(child?: ElementNode, dimensions?: Dimensions) {
    if (this.hasChildren) {
      log('Layout: ', this);
      isFunc(this.onBeforeLayout) &&
        this.onBeforeLayout.call(this, child, dimensions);

      calculateFlex(this);

      isFunc(this.onLayout) && this.onLayout.call(this, child, dimensions);
    }
  }

  _stateChanged() {
    log('State Changed: ', this, this.states);

    if (this.forwardStates) {
      // apply states to children first
      const states = this.states.slice() as States;
      this.children.forEach((c) => (c.states = states));
    }

    const states = config.stateMapperHook?.(this, this.states) || this.states;

    if (this._undoStates || (this.style && keyExists(this.style, states))) {
      this._undoStates = this._undoStates || {};
      let stylesToUndo: SolidStyles = {};

      for (const [state, undoStyles] of Object.entries(this._undoStates)) {
        // if state is no longer in the states undo it
        if (!states.includes(state)) {
          stylesToUndo = {
            ...stylesToUndo,
            ...undoStyles,
          } as SolidStyles;
        }
      }

      const newStyles = states.reduce((acc, state) => {
        const styles = this.style[state];
        if (styles) {
          acc = {
            ...acc,
            ...styles,
          };

          // get current values to undo state
          if (this._undoStates && !this._undoStates[state]) {
            this._undoStates[state] = {};
            Object.keys(styles).forEach((key) => {
              this._undoStates[state][key] = this[key as keyof this];
            });
          }
        }
        return acc;
      }, {});

      // Apply the styles
      Object.assign(this, { ...stylesToUndo, ...newStyles });
    }
  }
}
