# Base Components

There are two primitives provided by Solid Lightning:

- View
- Text

## View

The `<View>` is just like a div tag for HTML. This is the view component:

```jsx
import { type Component } from "solid-js";
import { type IntrinsicNodeProps } from "../intrinsicTypes.js";

export const View: Component<IntrinsicNodeProps> = (props) =>
   <node {...props}></node>;
```

All tags are broken down to either nodes or text in the renderer.

## Text

The `<Text>` component must be used whenever you want to display text on the screen.

```jsx
import { type Component } from "solid-js";
import { type IntrinsicTextProps } from "../intrinsicTypes.js";

export const Text: Component<IntrinsicTextProps> = (props) => <text {...props}></text>

```

Typescript provides helpers for all the possible attributes you can use for `View` and `Text` components.

## Custom Components

You can build your own components using the `<View>` and `<Text>` component

```jsx
import { type Component } from 'solid-js';
import { View, Text, type NodeProps, type NodeStyles, type TextStyles } from '@lightningjs/solid';
import styles from './Button.styles.js';

interface ButtonProps extends NodeProps {
  children: string | string[];
}

const Button: Component<ButtonProps> = props => {
  return (
    <View
      {...props}
      style={styles.Container}
    >
      <Text style={styles.Text}>{props.children}</Text>
    </View>
  );
};
```

To learn more about creating components read the [SolidJS documentation](https://docs.solidjs.com/guides/foundations/understanding-components)

## Component Lifecycle

Solid has two lifecycle hooks: -[onMount](https://www.solidjs.com/docs/latest/api#onmount) -[onCleanup](https://www.solidjs.com/docs/latest/api#oncleanup)

Read more about [Solids Lifecycle](https://docs.solidjs.com/references/api-reference/lifecycles/onMount)

## Component Events

`View` and `Text` provide a set of event handlers that can be used in various stages of a node creation process.

```jsx
  onCreate: (target: ElementNode)
  onLoad: (target: INode, nodeLoadedPayload: NodeLoadedPayload)
  onFail: (target: INode, nodeFailedPayload: NodeFailedPayload)
  onBeforeLayout: (child: ElementNode, dimensions: Dimensions) => boolean
  onLayout: (child: ElementNode, dimensions: Dimensions)
```

## use: (Directives) in Solid

SolidJS has built in [Directives](https://www.solidjs.com/docs/latest/api#use___) support via `use:` property. These only work on root elements `node` and `text`. Meaning you can't use `View` or `Text` with directives so instead do:

```
<node
  use:withPadding={[10, 15]}
  {...props}
  style={{
    color: '#00000099',
    borderRadius: 8,
    border: { width: 2, color: '#ffffff' },
  }}
>
```
