# Base Components

There are three primitives provided by Solid Lightning:

- Canvas
- View
- Text

## Canvas

The `<Canvas>` component will be used once as the root component in your App to initialize Lightning and create the base canvas tag.

### Props

- `ref`: Reference to root node and the renderer
- `options`: Object with options to pass to Renderer
- `onFirstRender`: Callback to run when app is first loaded, useful for unit tests
- `children`: JSX children to render

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
  onBeforeLayout: (child: ElementNode, dimensions: Dimensions)
  onLayout: (child: ElementNode, dimensions: Dimensions)
```
