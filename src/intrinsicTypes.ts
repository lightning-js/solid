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
} from '@lightningjs/renderer';
import { type ElementNode, type TextNode } from './core/node/index.js';

export interface BorderStyleObject {
  width: number;
  color: number;
}

export type BorderStyle = number | BorderStyleObject;

export interface IntrinsicCommonProps {
  ref?: any;
  children?: any;
  animate?: boolean;
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
  display?: 'flex';
  forwardStates?: boolean;
  onLoad?: (target: INode, dimensions: Dimensions) => void;
  onFail?: (target: INode, error: Error) => void;
  onBeforeLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  autofocus?: boolean;
  id?: string;
  flexDirection?: 'row' | 'column';
  selected?: number | null;
  borderRadius?: number;
  border?: BorderStyle;
  borderLeft?: BorderStyle;
  borderRight?: BorderStyle;
  borderTop?: BorderStyle;
  borderBottom?: BorderStyle;
}

// TODO: Add this concept back in and come up with a way to properly type it so it works
// internally and externally.
//
// Type that transforms all number typed properties to a tuple
// type TransformAnimatableNumberProps<T> = {
//   [K in keyof T]: number extends T[K] ? (number | [value: number, settings: AnimationSettings]) : T[K];
// };

export interface IntrinsicNodeStyleProps
  extends Partial<Omit<INodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {}

export interface IntrinsicTextNodeStyleProps
  extends Partial<Omit<ITextNodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps extends IntrinsicNodeStyleProps {
  style?: IntrinsicNodeStyleProps;
}

export interface IntrinsicTextProps extends IntrinsicTextNodeStyleProps {
  style?: IntrinsicTextNodeStyleProps;
}
