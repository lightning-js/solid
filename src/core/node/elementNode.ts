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
  type BorderRadius,
  type BorderStyle,
  type IntrinsicCommonProps,
  type IntrinsicNodeProps,
  type IntrinsicTextProps,
  type StyleEffects,
  type NodeStyles,
  type TextStyles,
  type ShaderEffectDesc,
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
import { NodeTypes } from './nodeTypes.js';

const { animationSettings: defaultAnimationSettings } = config;
const layoutQueue = new Set<ElementNode>();
let queueLayout = true;

function convertEffectsToShader(styleEffects: StyleEffects) {
  // Should be EffectDesc
  const effects: ShaderEffectDesc[] = [];

  for (const [type, props] of Object.entries(styleEffects)) {
    effects.push({ type, props } as ShaderEffectDesc);
  }
  return createShader('DynamicShader', { effects: effects as any[] });
}

function borderAccessor(
  direction: '' | 'Top' | 'Right' | 'Bottom' | 'Left' = '',
) {
  return {
    set(this: ElementNode, value: BorderStyle) {
      // Format: width || { width, color }
      if (isNumber(value)) {
        value = { width: value, color: 0x000000ff };
      }
      this.effects = this.effects
        ? {
            ...(this.effects || {}),
            ...{ [`border${direction}`]: value },
          }
        : { [`border${direction}`]: value };
    },
    get(this: ElementNode): BorderStyle | undefined {
      return this.effects?.[`border${direction}`];
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
  'absX',
  'absY',
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
  type: NodeTypes.TextNode | NodeTypes.Text;
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
export type SolidStyles = {
  [key: string]: NodeStyles | TextStyles | undefined;
} & (NodeStyles | TextStyles);

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
  type: NodeTypes;
  lng: INode | IntrinsicNodeProps | IntrinsicTextProps;
  rendered: boolean;
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
  private _effects?: StyleEffects;
  private _parent: ElementNode | undefined;
  private _style?: SolidStyles;
  private _states?: States;
  private _events?: Array<
    [string, (target: ElementNode, event?: Event) => void]
  >;
  private _animationSettings?: Partial<AnimationSettings>;
  private _animationQueue: Array<{
    props: Partial<INodeAnimatableProps>;
    animationSettings?: Partial<AnimationSettings>;
  }> = [];
  private _animationQueueSettings: Partial<AnimationSettings> | undefined;
  private _animationRunning: boolean = false;

  children: Children;

  constructor(name: string) {
    super();
    this.type = name === 'text' ? NodeTypes.TextNode : NodeTypes.Element;
    this.rendered = false;
    this.lng = {};
    this.children = new Children(this);
  }

  get effects(): StyleEffects | undefined {
    return this._effects;
  }

  set effects(v: StyleEffects) {
    this._effects = v;
    if (this.rendered) {
      this.shader = convertEffectsToShader(v);
    }
  }

  get parent() {
    return this._parent;
  }

  set parent(p) {
    this._parent = p;
    if (this.rendered) {
      this.lng.parent = p?.lng ?? null;
    }
  }

  set shader(shaderProps: Parameters<typeof createShader> | ShaderRef) {
    if (isArray(shaderProps)) {
      shaderProps = createShader(...shaderProps) as ShaderRef;
    }
    this.lng.shader = shaderProps;
  }

  _sendToLightningAnimatable(name: string, value: number | string) {
    if (
      this.rendered &&
      config.animationsEnabled &&
      this.transition &&
      (this.transition === true || this.transition[name])
    ) {
      const animationSettings =
        this.transition === true || this.transition[name] === true
          ? undefined
          : (this.transition[name] as undefined | AnimationSettings);

      const animationController = this.animate(
        { [name]: value },
        animationSettings,
      ).start();

      void animationController.waitUntilStopped().then(() => {
        (this.lng as INode).emit('animationFinished', { name, value });
      });

      return animationController;
    }

    (this.lng[name as keyof INode] as number | string) = value;
  }

  animate(
    props: Partial<INodeAnimatableProps>,
    animationSettings?: Partial<AnimationSettings>,
  ) {
    assertTruthy(this.rendered, 'Node must be rendered before animating');
    return (this.lng as INode).animate(
      props,
      animationSettings || this.animationSettings,
    );
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
    if (this.rendered) {
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
    return this.type === NodeTypes.TextNode;
  }

  _layoutOnLoad() {
    (this.lng as INode).on(
      'loaded',
      (_node: INode, loadedPayload: NodeLoadedPayload) => {
        const { dimensions } = loadedPayload;
        this.parent!.updateLayout(this, dimensions);
      },
    );
  }

  getText() {
    let result = '';
    for (let i = 0; i < this.children.length; i++) {
      result += this.children[i]!.text;
    }
    return result;
  }

  destroy() {
    if (this._queueDelete) {
      (this.lng as INode).destroy();
    }
  }
  // Must be set before render
  set onEvents(
    events: Array<[string, (target: ElementNode, event?: any) => void]>,
  ) {
    this._events = events;
  }

  get onEvents():
    | Array<[string, (target: ElementNode, event?: any) => void]>
    | undefined {
    return this._events;
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
    if (this.rendered) {
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
          this.onBeforeLayout.call(this, this, child, dimensions) || false;
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

      const newStyles: NodeStyles | TextStyles = states.reduce((acc, state) => {
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
      if (newStyles.transition !== undefined) {
        this.transition = newStyles.transition as NodeStyles['transition'];
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

    if (!parent.rendered) {
      console.warn('Parent not rendered yet: ', this);
      return;
    }

    if (this.rendered) {
      console.warn('Node already rendered: ', this);
      return;
    }

    if (parent.requiresLayout() && !layoutQueue.has(parent)) {
      layoutQueue.add(parent);
      if (queueLayout) {
        queueLayout = false;
        queueMicrotask(() => {
          queueLayout = true;
          const queue = [...layoutQueue];
          layoutQueue.clear();
          for (let i = queue.length - 1; i >= 0; i--) {
            queue[i]!.updateLayout();
          }
        });
      }
    }

    if (this.states.length) {
      this._stateChanged();
    }

    const props = node.lng as IntrinsicNodeProps | IntrinsicTextProps;
    props.x = props.x || 0;
    props.y = props.y || 0;

    if (parent.rendered) {
      props.parent = parent.lng;
    }

    if (node._effects) {
      props.shader = convertEffectsToShader(node._effects);
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

      if (props.textAlign && !props.contain) {
        console.warn('Text align requires contain: ', node.getText());
      }

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

        if (props.rtt && !props.color) {
          props.color = 0xffffffff;
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

    node.rendered = true;

    if (node.autosize && parent.requiresLayout()) {
      node._layoutOnLoad();
    }

    if (node.onFail) {
      node.lng.on('failed', node.onFail);
    }

    if (node.onLoad) {
      node.lng.on('loaded', node.onLoad);
    }

    isFunc(this.onCreate) && this.onCreate.call(this, node);

    node.onEvents &&
      node.onEvents.forEach(([name, handler]) => {
        (node.lng as INode).on(name, (inode, data) => handler(node, data));
      });

    // L3 Inspector adds div to the lng object
    //@ts-expect-error - div is not in the typings
    if (node.lng?.div) {
      //@ts-expect-error - div is not in the typings
      node.lng.div.element = node;
    }

    if (node.type === NodeTypes.Element) {
      // only element nodes will have children that need rendering
      for (let i = 0; i < node.children.length; i++) {
        const c = node.children[i];
        assertTruthy(c, 'Child is undefined');
        if ('render' in c) {
          c.render();
        } else if (c.text) {
          // Solid Show uses an empty text node as a placeholder
          console.warn('TextNode outside of <Text>: ', c);
        }
      }
    }

    node.autofocus && node.setFocus();
  }
}

for (const key of LightningRendererNumberProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get(): number {
      return this.lng[key];
    },
    set(this: ElementNode, v: number) {
      this._sendToLightningAnimatable(key, v);
    },
  });
}

for (const key of LightningRendererNonAnimatingProps) {
  Object.defineProperty(ElementNode.prototype, key, {
    get() {
      return this.lng[key];
    },
    set(v) {
      this.lng[key] = v;
    },
  });
}

// Add Border Helpers
Object.defineProperties(ElementNode.prototype, {
  borderRadius: {
    set(this: ElementNode, radius: BorderRadius) {
      this.effects = this.effects
        ? {
            ...this.effects,
            ...{ radius: { radius } },
          }
        : { radius: { radius } };
    },

    get(this: ElementNode): BorderRadius | undefined {
      return this.effects?.radius?.radius;
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
    set(this: ElementNode, props: LinearGradientEffectProps = {}) {
      this.effects = this.effects
        ? {
            ...this.effects,
            ...{ linearGradient: props },
          }
        : { linearGradient: props };
    },
    get(this: ElementNode): LinearGradientEffectProps | undefined {
      return this.effects?.linearGradient;
    },
  },
});
