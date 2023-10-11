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

import { renderer, createShader } from '../../index.js';
import Children from './children.js';
import States from './states.js';
import calculateFlex from '../flex.js';
import {
  normalizeColor,
  log,
  isArray,
  isNumber,
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
} from '@lightningjs/renderer';
import { assertTruthy } from '@lightningjs/renderer/utils';

const { animationSettings: defaultAnimationSettings } = config;

function convertEffectsToShader(styleEffects: any) {
  const effects = [];

  for (const [type, props] of Object.entries<Record<string, any>>(
    styleEffects,
  )) {
    if (props.color) {
      props.color = normalizeColor(props.color);
    }
    effects.push({ type, props });
  }
  return createShader('DynamicShader', { effects: effects as any });
}

function borderAccessor(
  direction: '' | 'Top' | 'Right' | 'Bottom' | 'Left' = '',
) {
  return {
    set(this: ElementNode, props: any) {
      // Format: width || { width, color }
      if (isNumber(props)) {
        props = { width: props, color: '#000000' };
      }
      this.effects = {
        ...(this.effects || {}),
        ...{ [`border${direction}`]: props },
      };
      this[`_border${direction}`] = props;
    },
    get(this: ElementNode) {
      return this[`_border${direction}`];
    },
  };
}

const LightningRendererNumberProps = [
  'alpha',
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

const LightningRendererColorProps = [
  'color',
  'colorTop',
  'colorRight',
  'colorLeft',
  'colorBottom',
  'colorTl',
  'colorTr',
  'colorBl',
  'colorBr',
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

export interface TextNode {
  name: 'TextNode';
  text: string;
  parent?: ElementNode;

  // These don't seem to be needed by a TextNode but are potentially assigned anyway
  // in various places
  zIndex?: undefined;
  states?: States;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
}

export type SolidNode = ElementNode | TextNode;

export class ElementNode extends Object {
  name: string;
  lng: INode | null = null;
  rendered: boolean;
  autofocus: boolean;
  zIndex?: number;
  selected?: number;
  flexDirection?: 'row' | 'column';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  gap?: number;
  justifyContent?:
    | 'flexStart'
    | 'flexEnd'
    | 'center'
    | 'spaceBetween'
    | 'spaceEvenly';
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  text?: string;
  display?: 'flex';
  forwardStates?: boolean;
  onLoad?: (target: INode, dimensions: Dimensions) => void;
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  private _undoStates?: Record<string, any>;
  private _renderProps: any;
  private _effects: any;
  private _parent?: ElementNode;
  private _shader?: ShaderRef;
  private _style?: any;
  private _states?: States;
  private _animationSettings?: any;
  private _updateLayoutOn?: any;
  private _width?: number;
  private _height?: number;
  private _color?: number;
  private _border?: number;
  private _borderLeft?: number;
  private _borderRight?: number;
  private _borderTop?: number;
  private _borderBottom?: number;
  public _animate?: boolean; // Public but uses _ prefix
  public _autosized?: boolean; // Public but uses _ prefix
  public _isDirty?: boolean; // Public but uses _ prefix
  children: Children;

  constructor(name: string) {
    super();
    this.name = name;
    this.rendered = false;
    this.autofocus = false;
    this._renderProps = {};
    this.children = new Children(this);

    for (const key of LightningRendererNumberProps) {
      Object.defineProperty(this, key, {
        get() {
          return this[`_${key}`] || (this.lng && this.lng[key]);
        },
        set(v) {
          this[`_${key}`] = v;
          this._sendToLightningAnimatable(key, v);
        },
      });
    }

    for (const key of LightningRendererColorProps) {
      Object.defineProperty(this, key, {
        get() {
          return this[`_${key}`] || (this.lng && this.lng[key]);
        },
        set(v) {
          this[`_${key}`] = v;
          if (isArray(v)) {
            v[0] = normalizeColor(v[0]);
          } else {
            v = normalizeColor(v);
          }
          this._sendToLightningAnimatable(key, v);
        },
      });
    }

    for (const key of LightningRendererNonAnimatingProps) {
      Object.defineProperty(this, key, {
        get() {
          return this[`_${key}`] || (this.lng && this.lng[key]);
        },
        set(v) {
          this[`_${key}`] = v;
          this._sendToLightning(key, v);
        },
      });
    }

    // Add Border Helpers
    Object.defineProperties(this, {
      borderRadius: {
        set(radius) {
          this._borderRadius = radius;
          this.effects = {
            ...(this.effects || {}),
            ...{ radius: { radius } },
          };
        },
        get() {
          return this._borderRadius;
        },
      },
      border: borderAccessor(),
      borderLeft: borderAccessor('Left'),
      borderRight: borderAccessor('Right'),
      borderTop: borderAccessor('Top'),
      borderBottom: borderAccessor('Bottom'),
    });

    Object.defineProperties(this, {
      linearGradient: {
        set(props = {}) {
          this._linearGradient = props;
          if (props.colors) {
            props.colors = props.colors.map((c: string | number) =>
              normalizeColor(c),
            );
          }
          this.effects = {
            ...(this.effects || {}),
            ...{ linearGradient: props },
          };
        },
        get() {
          return this._linearGradient;
        },
      },
    });
  }

  get effects() {
    return this._effects;
  }

  set effects(v) {
    this._effects = v;
    this.shader = convertEffectsToShader(v);
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

  get shader(): ShaderRef | undefined {
    return this._shader;
  }

  set shader(v: Parameters<typeof createShader> | ShaderRef | undefined) {
    if (isArray(v)) {
      this._shader = createShader(...v) as ShaderRef;
    } else {
      this._shader = v;
    }
    this._sendToLightning('shader', this._shader);
  }

  _sendToLightningAnimatable(
    name: string,
    value: [value: number | string, settings: any] | number | string,
  ) {
    if (this.rendered && this.lng) {
      if (isArray(value)) {
        return this.animate({ [name]: value[0] }, value[1]).start();
      }

      if (this._animate) {
        return this.animate({ [name]: value }).start();
      }

      (this.lng[name as keyof INode] as number | string) = value;
    } else {
      // Need to render before animating
      if (isArray(value)) {
        value = value[0];
      }
      this._renderProps[name] = value;
    }
  }

  _sendToLightning(name: string, value: unknown) {
    if (this.rendered && this.lng) {
      (this.lng[name as keyof INodeWritableProps] as unknown) = value;
    } else {
      this._renderProps[name] = value;
    }
  }

  animate(props: Partial<INodeAnimatableProps>, animationSettings?: any) {
    assertTruthy(this.lng, 'Node must be rendered before animating');
    return this.lng.animate(props, animationSettings || this.animationSettings);
  }

  setFocus() {
    if (this.rendered) {
      setActiveElement<ElementNode>(this);
    } else {
      this.autofocus = true;
    }
  }

  isTextNode() {
    return this.name === 'text';
  }

  _resizeOnTextLoad() {
    assertTruthy(this.lng);
    this.lng.once('textLoaded', (_node, size: Dimensions) => {
      this.width = size.width;
      this.height = size.height;
      assertTruthy(this.parent);
      this.parent.updateLayout(this, size);
    });
  }

  getText() {
    return this.children.map((c) => c.text).join('');
  }

  destroy() {
    this.lng && renderer.destroyNode(this.lng);
  }

  set style(value: any) {
    // Keys set in JSX are more important
    for (let key in value) {
      if (key === 'animate') {
        key = '_animate';
      }

      if (!this[key as keyof this]) {
        this[key as keyof this] = value[key as keyof ElementNode];
      }
    }

    this._style = value;
  }

  get style() {
    return this._style;
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  set states(v) {
    this._states = new States(this, v);
    if (this.rendered) {
      this._stateChanged();
    }
  }

  get states() {
    this._states = this._states || new States(this);
    return this._states;
  }

  get animationSettings() {
    return this._animationSettings || defaultAnimationSettings;
  }

  set animationSettings(v) {
    this._animationSettings = v;
  }

  get updateLayoutOn() {
    return this._updateLayoutOn;
  }

  set updateLayoutOn(v) {
    this._updateLayoutOn = v;
    queueMicrotask(() => this.updateLayout());
  }

  _applyZIndexToChildren() {
    const zIndex = this.zIndex;
    assertTruthy(zIndex);
    const zIndexIsInteger = zIndex >= 1 && parseInt('' + zIndex) === zIndex;
    const decimalSeparator = zIndexIsInteger ? '.' : '';

    this.children.forEach((c, i) => {
      if (!c.zIndex || c.zIndex < 1) {
        c.zIndex = parseFloat(`${zIndex}${decimalSeparator}${i + 1}`);
      }
    });
  }

  updateLayout(child?: ElementNode, dimensions?: Dimensions) {
    if (this.display === 'flex' && this.hasChildren) {
      log('Layout: ', this);
      calculateFlex(this);
    }

    isFunc(this.onLayout) && this.onLayout(child, dimensions);
  }

  _stateChanged() {
    log('State Changed: ', this, this.states);

    if (this.forwardStates) {
      // apply states to children first
      const states = this.states.slice() as States;
      this.children.forEach((c) => (c.states = states));
    }

    if (
      this._undoStates ||
      (this.style && keyExists(this.style, this.states))
    ) {
      this._undoStates = this._undoStates || {};
      let stylesToUndo = {};

      for (const [state, undoStyles] of Object.entries(this._undoStates)) {
        // if state is no longer in the states undo it
        if (!this.states.includes(state)) {
          stylesToUndo = {
            ...stylesToUndo,
            ...undoStyles,
          };
        }
      }

      const newStyles = this.states.reduce((acc, state) => {
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
              assertTruthy(this._undoStates);
              this._undoStates[state][key] = this[key as keyof this];
            });
          }
        }
        return acc;
      }, {});

      Object.assign(this, { ...stylesToUndo, ...newStyles });
    }
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const node = this;
    const parent = this.parent;
    node.x = node.x || 0;
    node.y = node.y || 0;

    // Parent is dirty whenever a node is inserted after initial render
    if (parent?._isDirty) {
      parent.updateLayout();
      parent._applyZIndexToChildren();
      parent._isDirty = false;
    }

    node.updateLayout();

    if (this.states.length) {
      this._stateChanged();
    }

    let props = node._renderProps;

    if (parent?.lng) {
      props.parent = parent.lng;
    }

    if (node.isTextNode()) {
      props = {
        ...config.fontSettings,
        ...props,
        text: node.getText(),
      };
      log('Rendering: ', this, props);
      node.lng = renderer.createTextNode(props);

      if (isFunc(node.onLoad)) {
        node.lng.once('textLoaded', node.onLoad);
      }

      if (!node.width || !node.height) {
        node._autosized = true;
        node._resizeOnTextLoad();
      }
    } else {
      // If its not an image or texture apply some defaults
      if (!(props.src || props.texture)) {
        assertTruthy(parent);
        // Set width and height to parent less offset
        if (isNaN(props.width)) {
          props.width = (parent.width || 0) - props.x;
          node._width = props.width;
        }

        if (isNaN(props.height)) {
          props.height = (parent.height || 0) - props.y;
          node._height = props.height;
        }

        if (!props.color) {
          //Default color to transparent - If you later set a src, you'll need
          // to set color '#ffffffff'
          node._color = props.color = 0x00000000;
        }
      }

      log('Rendering: ', this, props);
      node.hasChildren && node._applyZIndexToChildren();
      node.lng = renderer.createNode(props);

      if (node.onLoad) {
        node.lng.once('txLoaded', node.onLoad);
      }
    }

    node.rendered = true;
    node.autofocus && node.setFocus();
    // clean up after first render;
    delete this._renderProps;
  }
}
