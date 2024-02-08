# Styling / Properties

You can add styles to your JSX components using object notation or applying the properties directly to the JSX or via a ref:

```jsx
import { createEffect, createSignal } from 'solid-js';

let columnRef;
const Column = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flexStart',
  width: 1760,
  height: 500,
  gap: 50,
  y: 200,
  x: 80,
  color: '00000000',
};

createEffect(() => {
  columnRef.x = 200;
});

const [alpha, setAlpha] = createSignal(1);

<View ref={columnRef} alpha={alpha()} y={90} style={Column}>
  // ...add some children
</View>;
```

The style attribute takes an object of properties and passes them to the Lightning Renderer on initial creation of the component. The style object will not be reapplied if it is changed after creation. This keeps the style object as Read Only in the templating system allowing you to use it for multiple components. Additionally, when the style object is applied any properties on the JSX will have greater precedent so you can override styles on individual components. After the component is created, you can further change props via signals or imperatively with the ref to the component.

For UI Component libraries you can also pass an array to style. This allows for easy chaining of styling. This doesn't do a deep merge, so any state styles will be overriden by the top level style tag.

```jsx
const Top: Component<TopProps> = (props: TopProps) => {
  return (
    <ChildComp
      {...props}
      style={[props.style, styles.Container]}
      onSelectedChanged={chainFunctions(props.onSelectedChanged, withScrolling(props.y as number))}
    />
  );
};
```

## List of Properties

### Core Node Properties

These are found in the Renderer and applicable to all nodes:

- `x`: number
- `y`: number
- `width`: number
- `height`: number
- `alpha`: number
- `clipping`: boolean
- `color`: number
- `colorTop`: number
- `colorBottom`: number
- `colorLeft`: number
- `colorRight`: number
- `colorTl`: number
- `colorTr`: number
- `colorBl`: number
- `colorBr`: number
- `parent`: CoreNode | null
- `zIndex`: number
- `texture`: Texture | null
- `textureOptions`: TextureOptions | null
- `shader`: CoreShader | null
- `shaderProps`: Record<string, unknown> | null
- `zIndexLocked`: number
- `scaleX`: number
- `scaleY`: number
- `mount`: number
- `mountX`: number
- `mountY`: number
- `pivot`: number
- `pivotX`: number
- `pivotY`: number
- `rotation`: number

### SDF Text Nodes

Text node properties available from the Renderer

- `text`: string
- `textAlign`: `'left' | 'center' | 'right'`
- `color`: number
- `x`: number
- `y`: number
- `contain`: `'none' | 'width' | 'both'`
- `width`: number
- `height`: number
- `scrollable`: boolean
- `scrollY`: number
- `offsetY`: number
- `letterSpacing`: number
- `lineHeight`: number
- `maxLines`: number
- `textBaseline`: TextBaseline
- `verticalAlign`: TextVerticalAlign
- `overflowSuffix`: string

Solid adds the following props to help with layout and offer shortcuts to the ShaderEffects:

- `alignItems`: 'flexStart' | 'flexEnd' | 'center'
- `border`: BorderStyle
- `borderBottom`: BorderStyle
- `borderLeft`: BorderStyle
- `borderRadius`: number | number[]
- `borderRight`: BorderStyle
- `borderTop`: BorderStyle
- `display`: 'flex'
- `effects`: any
- `flexDirection`: 'row' | 'column'
- `gap`: number
- `justifyContent`: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceEvenly'
- `linearGradient`: any
- `marginBottom`: number
- `marginLeft`: number
- `marginRight`: number
- `marginTop`: number
- `transition`: Record<string, AnimationSettings> | true

### Prop Defaults

`<View>` components without a width and height value will inherit their parents width and height minus their x and y values. X and y will default to 0, 0 if not specified. `<Text>` component does not require any properties. If `<Text>` component is loaded in a flex container, it will update it's width and height when it loads.

### Colors

RGBA number 0xRRGGBBAA. If you want to use hex, `import { hexColor } from '@lightningjs/solid'` and do `hexColor('#c0ffee')` to convert colors to RGBA. Please know all hex colors are #RRGGBB so they are easy to convert to 0xRRGGBBAA and usually AA is ff for full alpha. By default, every node without a src attribute will have their color set to `0x00000000` making it transparent. If you have an element which sets it's src attribute after creation, you need to update color to `0xffffffff` so it's not transparent.

## Effects

### Border and borderRadius

`border` and `borderRadius` are special props which create effects for the DynamicShader found in the Lightning Renderer. These props can be set on the JSX or style object. The order in which you set the props determine how they are applied in the shader. Meaning you probably want to set borderRadius first. You can also set individual borders via `borderLeft`, `borderRight`, `borderTop`, `borderBottom`. These properties do not support animations.

```
const style = {
  borderRadius: 30,
  border: { width: 10, color: 0x000000ff }
}

// or

const style = {
  borderLeft: { width: 10, color: 0x000000ff },
  borderRight: { width: 10, color: 0x000000ff }
}

```

### linearGradient

`linearGradient` is another special effect that can be used like a style with following syntax.

```
linearGradient:
    {
      angle: 225,
      stops: [0.1, 0.5],
      colors: [
        0xff0000ff, 0x00000000,
      ],
    },
```

You can have as many stops or colors as you like. Note: linearGradient has a high performance price at this time. Instead, use PNG with alpha transparency.
