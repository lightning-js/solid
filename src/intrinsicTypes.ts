import {
  type Dimensions,
  type INode,
  type INodeWritableProps,
  type ITextNodeWritableProps,
} from '@lightningjs/renderer';
import { type ElementNode, type TextNode } from './core/node/index.js';

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
  onLayout?: (child: ElementNode, dimensions: Dimensions) => void;
  autofocus?: boolean;
  id?: string;
  flexDirection?: 'row' | 'column';
  selected?: number | null;
}

export interface IntrinsicTextProps
  extends Partial<Omit<ITextNodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps
  extends Partial<Omit<INodeWritableProps, 'parent' | 'shader'>>,
    IntrinsicCommonProps {}
