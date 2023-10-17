/* eslint-disable @typescript-eslint/no-namespace */
import {
  type IntrinsicNodeProps,
  type IntrinsicTextProps,
} from './intrinsicTypes.js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      node: Partial<IntrinsicNodeProps>;
      text: Partial<IntrinsicTextProps>;
      canvas: Partial<IntrinsicNodeProps>;
    }
  }
}
