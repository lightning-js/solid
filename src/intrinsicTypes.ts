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
  type INodeAnimatableProps,
  type INodeWritableProps,
  type ITextNodeWritableProps,
  type NodeFailedPayload,
  type NodeLoadedPayload,
} from '@lightningjs/renderer';
import { type JSX } from 'solid-js';
import { type ElementNode } from './core/node/index.js';
import type { NodeStates } from './core/node/states.js';

export interface BorderStyleObject {
  width: number;
  color: number;
}

export type BorderStyle = number | BorderStyleObject;

export interface IntrinsicCommonProps {
  alignItems?: 'flexStart' | 'flexEnd' | 'center';
  animate?: boolean;
  animationSettings?: Partial<AnimationSettings>;
  autofocus?: boolean;
  border?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;
  borderRadius?: number;
  borderRight?: BorderStyle;
  borderTop?: BorderStyle;
  display?: 'flex';
  flexDirection?: 'row' | 'column';
  forwardStates?: boolean;
  gap?: number;
  id?: string;
  justifyContent?:
    | 'flexStart'
    | 'flexEnd'
    | 'center'
    | 'spaceBetween'
    | 'spaceEvenly';
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  onBeforeLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  onLoad?: (target: INode, nodeLoadedPayload: NodeLoadedPayload) => void;
  onFail?: (target: INode, nodeFailedPayload: NodeFailedPayload) => void;
  ref?: ElementNode | ((node: ElementNode | null) => void) | null | undefined;
  selected?: number;
  states?: NodeStates;
  text?: string;
}

export type AnimatableNumberProp = [
  value: number,
  settings: Partial<AnimationSettings>,
];
// TODO: Add this concept back in and come up with a way to properly type it so it works
// internally and externally.
//
// Type that transforms all number typed properties to a tuple
type TransformAnimatableNumberProps<T> = {
  [K in keyof T]?: number extends T[K] ? number | AnimatableNumberProp : T[K];
};

export type TransformableNodeWritableProps = TransformAnimatableNumberProps<
  Omit<INodeAnimatableProps, 'zIndex' | 'zIndexLocked'>
>;

type INodeStyleProps = Partial<
  Omit<
    INodeWritableProps,
    'parent' | 'shader' | keyof TransformableNodeWritableProps
  >
> &
  TransformableNodeWritableProps &
  IntrinsicCommonProps;

export interface IntrinsicNodeStyleProps extends INodeStyleProps {
  effects?: any; // Should be EffectMap
}

export interface IntrinsicTextNodeStyleProps
  extends Partial<Omit<ITextNodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps extends IntrinsicNodeStyleProps {
  style?: IntrinsicNodeStyleProps;
  children?: JSX.Element;
}

export interface IntrinsicTextProps extends IntrinsicTextNodeStyleProps {
  style?: IntrinsicTextNodeStyleProps;
  children: string | string[];
}

export type NodeStyles = IntrinsicNodeStyleProps;
export type TextStyles = IntrinsicTextNodeStyleProps;
export type NodeProps = IntrinsicNodeProps;
export type TextProps = IntrinsicTextProps;
