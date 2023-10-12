import {
  IntrinsicNodeProps,
  type IntrinsicTextProps,
} from './src/intrinsicTypes.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      node: Partial<IntrinsicNodeProps>;
      text: Partial<IntrinsicTextProps>;
      canvas: Partial<IntrinsicNodeProps>;
    }
  }
}
