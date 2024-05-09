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

import { renderer, createShader } from '../lightningInit.js';
import {
  type BorderStyleObject,
  type Effects,
  type IntrinsicCommonProps,
  type IntrinsicNodeProps,
  type IntrinsicTextProps,
  type NodeStyles,
  type TextStyles,
} from '../../index.js';
import Children from './children.js';
import States, { type NodeStates } from './states.js';
import calculateFlex from '../flex.js';
import {
  log,
  isArray,
  isNumber,
  isFunc,
  keyExists,
  flattenStyles,
} from '../utils.js';
import { config } from '../../config.js';
import { setActiveElement } from '../activeElement.js';
import type {
  RendererMain,
  INode,
  INodeAnimatableProps,
  INodeWritableProps,
  ShaderRef,
  Dimensions,
  AnimationSettings,
  NodeLoadedPayload,
  LinearGradientEffectProps,
} from '@lightningjs/renderer';
import { assertTruthy } from '@lightningjs/renderer/utils';

const { animationSettings: defaultAnimationSettings } = config;
const layoutQueue: ElementNode[] = [];
let queueLayout = true;

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
    set(
      this: ElementNode,
      value: number | { width: number; color: number | string },
    ) {
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
  'autosize',
  'clipping',
  'contain',
  'fontFamily',
  'fontStretch',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'maxLines',
  'offsetY',
  'overflowSuffix',
  'rtt',
  'scrollable',
  'scrollY',
  'src',
  'text',
  'textAlign',
  'textBaseline',
  'textOverflow',
  'texture',
  'verticalAlign',
  'wordWrap',
];

export interface TextNode {
  id?: string;
  name: string;
  text: string;
  parent: ElementNode | undefined;
  zIndex?: number;
  states?: States;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  flexItem?: boolean;
  flexOrder?: number;
  _queueDelete?: boolean;
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
export class ElementNode extends Object {
  id?: string;
  debug?: boolean;
  name: string;
  lng: INode | undefined;
  renderer?: RendererMain;
  selected?: number;
  autofocus?: boolean;
  flexItem?: boolean;
  flexOrder?: number;
  flexBoundary?: 'contain' | 'fixed'; // default is undefined - contained for flex calculated size
  _queueDelete?: boolean;
  forwardFocus?:
    | number
    | ((this: ElementNode, elm: ElementNode) => boolean | void);

  private _undoStyles?: string[];
  private _renderProps: IntrinsicNodeProps | IntrinsicTextProps;
  private _effects?: Effects;
  private _parent: ElementNode | undefined;
  private _shader?: ShaderRef;
  private _style?: SolidStyles;
  private _states?: States;
  private _events?: Array<
    [string, (target: ElementNode, event?: Event) => void]
  >;
  private _animationSettings?: Partial<AnimationSettings>;
  public _borderRadius?: number;
  public _border?: BorderStyleObject;
  public _borderLeft?: BorderStyleObject;
  public _borderRight?: BorderStyleObject;
  public _borderTop?: BorderStyleObject;
  public _borderBottom?: BorderStyleObject;
  private _animationQueue: Array<{
    props: Partial<INodeAnimatableProps>;
    animationSettings?: Partial<AnimationSettings>;
  }> = [];
  private _animationQueueSettings: Partial<AnimationSettings> | undefined;
  private _animationRunning: boolean = false;

  children: Children;

  constructor(name: string) {
    super();
    this.name = name;
    this._renderProps = {};
    this.children = new Children(this);
  }

  get effects() {
    return this._effects;
  }

  set effects(v) {
    this._effects = v;
    if (this.lng) {
      this.shader = convertEffectsToShader(v);
    }
  }

  get parent() {
    return this._parent;
  }

  set parent(p) {
    this._parent = p;
    if (this.lng) {
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
    if (this.lng) {
      if (
        config.animationsEnabled &&
        this.transition &&
        (this.transition === true || this.transition[name])
      ) {
        const animationSettings =
          this.transition === true || this.transition[name] === true
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
    if (this.lng) {
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

  chain(
    props: Partial<INodeAnimatableProps>,
    animationSettings?: Partial<AnimationSettings>,
  ) {
    if (this._animationRunning) {
      this._animationQueue = [];
      this._animationRunning = false;
    }

    if (animationSettings) {
      this._animationQueueSettings = animationSettings;
    } else if (!this._animationQueueSettings) {
      this._animationQueueSettings =
        animationSettings || this.animationSettings;
    }
    animationSettings = animationSettings || this._animationQueueSettings;
    this._animationQueue.push({ props, animationSettings });
    return this;
  }

  async start() {
    let animation = this._animationQueue.shift();
    while (animation) {
      this._animationRunning = true;
      await this.animate(animation.props, animation.animationSettings)
        .start()
        .waitUntilStopped();
      animation = this._animationQueue.shift();
    }
    this._animationRunning = false;
    this._animationQueueSettings = undefined;
  }

  setFocus() {
    if (this.lng) {
      // can be 0
      if (this.forwardFocus !== undefined) {
        if (isFunc(this.forwardFocus)) {
          if (this.forwardFocus.call(this, this) !== false) {
            return;
          }
        } else {
          const focusedIndex =
            typeof this.forwardFocus === 'number' ? this.forwardFocus : null;
          if (focusedIndex !== null && focusedIndex < this.children.length) {
            const child = this.children[focusedIndex];
            child instanceof ElementNode && child.setFocus();
            return;
          }
        }
      }
      // Delay setting focus so children can render (useful for Row + Column)
      queueMicrotask(() => setActiveElement<ElementNode>(this));
    } else {
      this.autofocus = true;
    }
  }

  isTextNode() {
    return this.name === 'text';
  }

  _layoutOnLoad() {
    this.lng!.on('loaded', (_node: INode, loadedPayload: NodeLoadedPayload) => {
      const { dimensions } = loadedPayload;
      this.parent!.updateLayout(this, dimensions);
    });
  }

  getText() {
    return this.children.map((c) => c.text).join('');
  }

  destroy() {
    if (this._queueDelete) {
      this.lng?.destroy();
    }
  }
  // Must be set before render
  set onEvents(
    events: Array<[string, (target: ElementNode, event?: any) => void]>,
  ) {
    this._events = events;
  }

  get onEvents() {
    return this._events || [];
  }

  set style(values: SolidStyles | (SolidStyles | undefined)[]) {
    if (isArray(values)) {
      this._style = flattenStyles(values);
    } else {
      this._style = values;
    }
    // Keys set in JSX are more important
    for (const key in this._style) {
      // be careful of 0 values
      if (this[key as keyof SolidStyles] === undefined) {
        this[key as keyof SolidStyles] = this._style[key as keyof SolidStyles];
      }
    }
  }

  get style(): SolidStyles {
    return this._style!;
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  getChildById(id: string) {
    return this.children.find((c) => c.id === id);
  }

  searchChildrenById(id: string): SolidNode | undefined {
    // traverse all the childrens children
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child instanceof ElementNode) {
        if (child.id === id) {
          return child;
        }

        const found = child.searchChildrenById(id);
        if (found) {
          return found;
        }
      }
    }
  }

  set states(states: NodeStates) {
    this._states = new States(this._stateChanged.bind(this), states);
    if (this.lng) {
      this._stateChanged();
    }
  }

  get states(): States {
    this._states = this._states || new States(this._stateChanged.bind(this));
    return this._states;
  }

  get animationSettings(): Partial<AnimationSettings> {
    return this._animationSettings || defaultAnimationSettings;
  }

  set animationSettings(animationSettings: Partial<AnimationSettings>) {
    this._animationSettings = animationSettings;
  }

  requiresLayout() {
    return this.display === 'flex' || this.onBeforeLayout;
  }

  updateLayout(child?: ElementNode, dimensions?: Dimensions) {
    if (this.hasChildren) {
      log('Layout: ', this);
      let changedLayout = false;
      if (isFunc(this.onBeforeLayout)) {
        changedLayout =
          this.onBeforeLayout.call(this, this, child, dimensions) ?? false;
      }

      if (this.display === 'flex') {
        if (calculateFlex(this) || changedLayout) {
          this.parent?.updateLayout();
        }
      } else if (changedLayout) {
        this.parent?.updateLayout();
      }

      isFunc(this.onLayout) &&
        this.onLayout.call(this, this, child, dimensions);
    }
  }

  _stateChanged() {
    log('State Changed: ', this, this.states);

    if (this.forwardStates) {
      // apply states to children first
      const states = this.states.slice() as States;
      this.children.forEach((c) => (c.states = states));
    }

    const states = this.states;

    if (this._undoStyles || (this.style && keyExists(this.style, states))) {
      this._undoStyles = this._undoStyles || [];
      const stylesToUndo: { [key: string]: any } = {};

      this._undoStyles.forEach((styleKey) => {
        stylesToUndo[styleKey] = this.style[styleKey];
      });

      const newStyles = states.reduce((acc, state) => {
        const styles = this.style[state];
        if (styles) {
          acc = {
            ...acc,
            ...styles,
          };
        }
        return acc;
      }, {});

      this._undoStyles = Object.keys(newStyles);

      // Apply transition first
      if ((newStyles as any).transition !== undefined) {
        this.transition = (newStyles as any).transition;
      }

      // Apply the styles
      Object.assign(this, stylesToUndo, newStyles);
    }
  }

  render() {
    // Elements are rendered from the outside in, then `insert`ed from the inside out.

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const node = this;
    const parent = this.parent;

    if (!parent) {
      console.warn('Parent not set - no node created for: ', this);
      return;
    }

    if (!parent.lng) {
      console.warn('Parent not rendered yet: ', this);
      return;
    }

    if (this.lng) {
      console.warn('Node already rendered: ', this);
      return;
    }

    if (parent.requiresLayout() && layoutQueue.indexOf(parent) === -1) {
      layoutQueue.push(parent);
      if (queueLayout) {
        queueLayout = false;
        queueMicrotask(() => {
          queueLayout = true;
          while (layoutQueue.length) {
            const n = layoutQueue.pop();
            n!.updateLayout();
          }
        });
      }
    }

    if (this.states.length) {
      this._stateChanged();
    }

    const props = node._renderProps;
    props.x = props.x || 0;
    props.y = props.y || 0;

    if (parent.lng) {
      props.parent = parent.lng;
    }

    if (node._effects) {
      this.shader = convertEffectsToShader(node._effects);
    }

    if (node.isTextNode()) {
      if (config.fontSettings) {
        for (const key in config.fontSettings) {
          if (props[key] === undefined) {
            props[key] = config.fontSettings[key];
          }
        }
      }
      props.text = node.getText();

      // contain is either width or both
      if (props.contain) {
        if (!props.width) {
          props.width =
            (parent.width || 0) - props.x - (props.marginRight || 0);
        }

        if (props.contain === 'both' && !props.height && !props.maxLines) {
          props.height =
            (parent.height || 0) - props.y - (props.marginBottom || 0);
        } else if (props.maxLines === 1) {
          props.height = (props.height ||
            props.lineHeight ||
            props.fontSize) as number;
        }
      }

      log('Rendering: ', this, props);
      node.lng = renderer.createTextNode(props);

      if (parent.requiresLayout() && (!props.width || !props.height)) {
        node._layoutOnLoad();
      }
    } else {
      // If its not an image or texture apply some defaults
      if (!props.texture) {
        // Set width and height to parent less offset
        if (isNaN(props.width as number)) {
          props.width = (parent.width || 0) - props.x;
        }

        if (isNaN(props.height as number)) {
          props.height = (parent.height || 0) - props.y;
        }

        if (!props.color && !props.src) {
          // Default color to transparent - If you later set a src, you'll need
          // to set color '#ffffffff'
          props.color = 0x00000000;
        }
      }

      log('Rendering: ', this, props);
      node.lng = renderer.createNode(props);
    }

    if (props.autosize && parent.requiresLayout()) {
      node._layoutOnLoad();
    }

    if (node.onFail) {
      node.lng.on('failed', node.onFail);
    }

    if (node.onLoad) {
      node.lng.on('loaded', node.onLoad);
    }

    isFunc(this.onCreate) && this.onCreate.call(this, node);

    node.onEvents.forEach(([name, handler]) => {
      node.lng?.on(name, (inode, data) => handler(node, data));
    });

    // L3 Inspector adds div to the lng object
    //@ts-expect-error - div is not in the typings
    if (node.lng?.div) {
      //@ts-expect-error - div is not in the typings
      node.lng.div.solid = node;
    }

    if (node.name !== 'text') {
      node.children.forEach((c) => {
        if ((c as ElementNode).render) {
          (c as ElementNode).render();
        } else if (c.text !== '') {
          // Solid Show uses an empty text node as a placeholder
          console.warn('TextNode outside of <Text>: ', c);
        }
      });
    }

    node.autofocus && node.setFocus();
    // clean up after first render;
    this._renderProps = {};
  }
}

for (const key of LightningRendererNumberProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get(): number {
      return this.lng ? this.lng[key] : this._renderProps[key];
    },
    set(v: number) {
      this._sendToLightningAnimatable(key, v);
    },
  });
}

for (const key of LightningRendererNonAnimatingProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get() {
      return this.lng ? this.lng[key] : this._renderProps[key];
    },
    set(v) {
      this._sendToLightning(key, v);
    },
  });
}

// Add Border Helpers
Object.defineProperties(ElementNode.prototype, {
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

Object.defineProperties(ElementNode.prototype, {
  linearGradient: {
    set(props: LinearGradientEffectProps = {}) {
      this._linearGradient = props;
      this.effects = {
        ...(this.effects || {}),
        ...{ linearGradient: props },
      };
    },
    get(): LinearGradientEffectProps {
      return this._linearGradient;
    },
  },
});
