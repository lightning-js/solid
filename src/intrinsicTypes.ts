import {
  type INodeWritableProps,
  type ITextNodeWritableProps,
} from '@lightningjs/renderer';

interface IntrinsicCommonProps {
  onFocus?: () => void;
  onBlur?: () => void;
  selected?: number;
  children?: any;
  ref?: any;
}

export interface IntrinsicTextProps
  extends Partial<ITextNodeWritableProps>,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps
  extends Partial<INodeWritableProps>,
    IntrinsicCommonProps {}
