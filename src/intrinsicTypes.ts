import { type INodeWritableProps, type ITextNodeWritableProps } from "@lightningjs/renderer";

export interface KeyMap {
  ArrowLeft: 'Left';
  ArrowRight: 'Right';
  ArrowUp: 'Up';
  ArrowDown: 'Down';
  Enter: 'Enter';
  l: 'Last';
}

/**
 * Generates a map of event handlers for each key in the KeyMap
 */
type KeyMapEventHandlers = {
  [K in keyof KeyMap as `on${Capitalize<KeyMap[K]>}`]?: () => void;
}

interface IntrinsicCommonProps extends KeyMapEventHandlers {
  onFocus?: () => void;
  onBlur?: () => void;
  selected?: number;
  children?: any;
  ref?: any;
}

export interface IntrinsicTextProps extends Partial<ITextNodeWritableProps>, IntrinsicCommonProps {
}

export interface IntrinsicNodeProps extends Partial<INodeWritableProps>, IntrinsicCommonProps {
}
