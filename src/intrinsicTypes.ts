import {
  type INodeWritableProps,
  type ITextNodeWritableProps,
} from '@lightningjs/renderer';

interface IntrinsicCommonProps {
  onFocus?: () => void;
  onBlur?: () => void;
  onLoad?: () => void;
  style?: any;
  autofocus?: boolean;
  id?: string;
  ref?: any;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  marginBottom?: number;
  states?: Array<string>;
}

export interface IntrinsicTextProps
  extends Partial<ITextNodeWritableProps>,
    IntrinsicCommonProps {}

export interface IntrinsicNodeProps
  extends Partial<INodeWritableProps>,
    IntrinsicCommonProps {
  selected?: number;
  children?: any;
  effects?: any;
  animate?: boolean;
}
