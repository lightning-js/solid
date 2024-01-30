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

import {
  type AnimationSettings,
  type Dimensions,
  type INode,
  type INodeWritableProps,
  type ITextNodeWritableProps,
  type NodeFailedPayload,
  type NodeLoadedPayload,
} from '@lightningjs/renderer';
import { type JSX } from 'solid-js';
import { type ElementNode } from './core/node/index.js';
import type { NodeStates } from './core/node/states.js';

type AddUndefined<T> = {
  [K in keyof T]: T[K] | undefined;
};

export interface BorderStyleObject {
  width: number;
  color: number;
}

export type BorderStyle = number | BorderStyleObject;

export interface IntrinsicNodeCommonProps {
  animationSettings?: Partial<AnimationSettings>;
  autofocus?: boolean;
  forwardStates?: boolean;
  id?: string;
  onCreate?: (target: ElementNode) => void;
  onLoad?: (target: INode, nodeLoadedPayload: NodeLoadedPayload) => void;
  onFail?: (target: INode, nodeFailedPayload: NodeFailedPayload) => void;
  onBeforeLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  ref?: ElementNode | ((node: ElementNode) => void) | undefined;
  selected?: number;
  states?: NodeStates;
  text?: string;
}

export interface IntrinsicNodeStyleCommonProps {
  alignItems?: 'flexStart' | 'flexEnd' | 'center';
  border?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;
  borderRadius?: number | number[];
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
  transition?: Record<string, Partial<AnimationSettings> | true> | true;
}

export interface IntrinsicTextStyleCommonProps {
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface IntrinsicCommonProps
  extends IntrinsicNodeCommonProps,
    IntrinsicNodeStyleCommonProps,
    IntrinsicTextStyleCommonProps {}
export interface IntrinsicNodeStyleProps
  extends Partial<Omit<INodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicNodeStyleCommonProps {
  [key: string]: unknown;
}

export interface IntrinsicTextNodeStyleProps
  extends Partial<Omit<ITextNodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicTextStyleCommonProps {
  [key: string]: unknown;
}

export interface IntrinsicNodeProps
  extends AddUndefined<IntrinsicNodeCommonProps & IntrinsicNodeStyleProps> {
  style?: IntrinsicNodeStyleProps | undefined;
  children?: JSX.Element | undefined;
}

export interface IntrinsicTextProps
  extends AddUndefined<IntrinsicNodeCommonProps & IntrinsicTextNodeStyleProps> {
  style?: IntrinsicTextNodeStyleProps | undefined;
  children: string | string[];
}

export type NodeStyles = IntrinsicNodeStyleProps;
export type TextStyles = IntrinsicTextNodeStyleProps;
export type NodeProps = IntrinsicNodeProps;
export type TextProps = IntrinsicTextProps;
