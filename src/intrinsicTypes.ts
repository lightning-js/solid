import {
  type INodeWritableProps,
  type ITextNodeWritableProps,
} from '@lightningjs/renderer';
import { type ElementNode, type TextNode } from './core/node/index.js';

interface IntrinsicCommonProps {
  onFocus?: () => void;
  onBlur?: () => void;
  ref?: any;
  children?: any;
}

export interface IntrinsicTextProps
  extends Partial<Omit<ITextNodeWritableProps, 'text' | 'parent'>>,
    TextNode,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps
  extends Partial<Omit<INodeWritableProps, 'animate' | 'parent' | 'shader'>>,
    Partial<Omit<ElementNode, 'children' | 'animate'>>,
    IntrinsicCommonProps {
  animate?: boolean;
}
