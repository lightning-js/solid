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

import { createShader } from '../renderer/index.js';
import {
  type BorderStyleObject,
  type IntrinsicCommonProps,
} from '../../index.js';
import calculateFlex from '../flex.js';
import { log, isArray, isNumber, isFunc, keyExists } from '../utils.js';
import { config } from '../../config.js';
import type {
  INode,
  INodeAnimatableProps,
  INodeWritableProps,
  ShaderRef,
  RendererMain,
  Dimensions,
  AnimationSettings,
  NodeLoadedPayload,
} from '@lightningjs/renderer';
import BaseNode from './base.js';
import { setActiveElement } from '../activeElement.js';
import type { SolidNode } from '../../types.js';
import { assertTruthy } from '@lightningjs/renderer/utils';

const { animationSettings: defaultAnimationSettings } = config;

function convertEffectsToShader(styleEffects: any) {
  const effects = [];

  for (const [type, props] of Object.entries<Record<string, any>>(
    styleEffects,
  )) {
    effects.push({ type, props });
  }
  return createShader('DynamicShader', { effects: effects as any });
}

function borderAccessor(
  direction: '' | 'Top' | 'Right' | 'Bottom' | 'Left' = '',
) {
  return {
    set(this: ElementNode, value: number | { width: number; color: number }) {
      // Format: width || { width, color }
      if (isNumber(value)) {
        value = { width: value, color: 0x000000ff };
      }
      this.effects = {
        ...(this.effects || {}),
        ...{ [`border${direction}`]: value },
      };
      this[`_border${direction}`] = value;
    },
    get(this: ElementNode) {
      return this[`_border${direction}`];
    },
  };
}

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
  'maxLines',
  'maxLinesSuffix',
  'textBaseline',
  'textOverflow',
  'verticalAlign',
  'wordWrap',
];

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ElementNode extends BaseNode<SolidNode> {
  alignItems?: 'flexStart' | 'flexEnd' | 'center';
  border?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;
  borderRadius?: number;
  borderRight?: BorderStyle;
  borderTop?: BorderStyle;
  display?: 'flex';
  effects?: any; // Should be EffectMap
  flexDirection?: 'row' | 'column';
  gap?: number;
  justifyContent?:
    | 'flexStart'
    | 'flexEnd'
    | 'center'
    | 'spaceBetween'
    | 'spaceEvenly';
  linearGradient?: any; // Should be typeof LinearGradientEffect
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  transition?: Record<string, Partial<AnimationSettings> | true>;

  constructor(name: string) {
    super(this);
    this.name = name;
    this.rendered = false;
    this._renderProps = { x: 0, y: 0 };

    for (const key of LightningRendererNumberProps) {
      Object.defineProperty(this, key, {
        get(): number {
          return this[`_${key}`] || (this.lng && this.lng[key]);
        },
        set(v: number) {
          this[`_${key}`] = v;
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
        set(this: ElementNode, radius) {
          this._borderRadius = radius;
          this.effects = {
            ...(this.effects || {}),
            ...{ radius: { radius } },
          };
        },
        get(this: ElementNode) {
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

  _sendToLightningAnimatable(name: string, value: number | string) {
    if (this.rendered && this.lng) {
      if (this.transition && this.transition[name]) {
        const animationSettings =
          this.transition[name] === true
            ? undefined
            : (this.transition[name] as undefined | AnimationSettings);
        return this.animate({ [name]: value }, animationSettings).start();
      }

      (this.lng[name as keyof INode] as number | string) = value;
    } else {
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

  animate(
    props: Partial<INodeAnimatableProps>,
    animationSettings?: Partial<AnimationSettings>,
  ) {
    assertTruthy(this.lng, 'Node must be rendered before animating');
    return this.lng.animate(props, animationSettings || this.animationSettings);
  }

  isTextNode() {
    return false;
  }

  setProperty(name: string, value: any = true): void {
    if (this.rendered) {
      this.lng[name] = value;
    } else {
      this._renderProps[name] = value;
    }
  }

  _resizeOnTextLoad() {
    this.lng!.once(
      'loaded',
      (_node: INode, loadedPayload: NodeLoadedPayload) => {
        if (loadedPayload.type === 'text') {
          const { dimensions } = loadedPayload;

          this.width = dimensions.width;
          this.height = dimensions.height;
          this.parent.updateLayout(this, dimensions);
        }
      },
    );
  }

  set style(value: SolidStyles) {
    // Keys set in JSX are more important
    for (const key in value) {
      if (!this[key as keyof SolidStyles]) {
        this[key as keyof SolidStyles] = value[key as keyof SolidStyles];
      }
    }

    this._style = value;
  }

  get style(): SolidStyles {
    return this._style;
  }

  get animationSettings(): Partial<AnimationSettings> {
    return this._animationSettings || defaultAnimationSettings;
  }

  set animationSettings(animationSettings: Partial<AnimationSettings>) {
    this._animationSettings = animationSettings;
  }

  setFocus() {
    if (this.rendered) {
      // Delay setting focus so children can render (useful for Row + Column)
      queueMicrotask(() => setActiveElement(this));
    } else {
      this.autofocus = true;
    }
  }

  updateLayout(child?: SolidNode, dimensions?: Dimensions) {
    if (this.hasChildren) {
      log('Layout: ', this);
      isFunc(this.onBeforeLayout) &&
        this.onBeforeLayout.call(this, child, dimensions);

      if (this.display === 'flex') {
        if (calculateFlex(this)) {
          this.parent?.updateLayout();
        }
      }

      isFunc(this.onLayout) && this.onLayout.call(this, child, dimensions);
    }
  }

  render(renderer: RendererMain) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const node = this;
    const parent = this.parent!;

    // Parent is dirty whenever a node is inserted after initial render
    if (parent._isDirty) {
      parent.updateLayout();
      parent._isDirty = false;
    }

    node.updateLayout();

    if (this.states.length) {
      this._stateChanged();
    }

    const props = node._renderProps;

    if (parent.lng) {
      props.parent = parent.lng;
    }

    // If its not an image or texture apply some defaults
    if (!(props.src || props.texture)) {
      // Set width and height to parent less offset
      if (isNaN(props.width)) {
        props.width = (parent.width || 0) - props.x;
        node._width = props.width;
        node._autosized = true;
      }

      if (isNaN(props.height)) {
        props.height = (parent.height || 0) - props.y;
        node._height = props.height;
        node._autosized = true;
      }

      if (!props.color) {
        // Default color to transparent - If you later set a src, you'll need
        // to set color '#ffffffff'
        node._color = props.color = 0x00000000;
      }
    }

    log('Rendering: ', this, props);
    node.lng = renderer.createNode(props);

    if (node.onFail) {
      node.lng.on('failed', node.onFail);
    }

    if (node.onLoad) {
      node.lng.on('loaded', node.onLoad);
    }

    isFunc(this.onCreate) && this.onCreate.call(this, node);

    node.rendered = true;
    node.autofocus && node.setFocus();
    // clean up after first render;
    delete this._renderProps;
  }
}
