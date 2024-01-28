# Layout and Positioning Elements

All elements require the following properties in order for the renderer to show them on the screen:

- `x` - the x position of the Element in pixels, relative to it's parent - allows negative values
- `y` - the y position of the Element in pixels, relative to it's parent - allows negative values
- `width` - the width of the element in pixels
- `height` - the height of the element in pixels

Components without a width and height value will inherit their parents width and height minus their x and y values. X and y will default to 0, 0 if not specified. The `<Text>` component does not require any properties (it will use the default text properties).

## Flex

A fundamental tool for layout is Flex container. At the moment there is a very barebone flex implementation (`display: flex`). It supports `flexDirection`, `justifyContent`, `alignItems` and `gap` and is very useful for laying out elements in rows and columns.

```jsx
import { View, Text } from '@lightningjs/solid';

const RowStyles = {
  display: 'flex',
  justifyContent: 'flexStart',
  width: 1760,
  height: 300,
  gap: 26,
  y: 400,
};
<View gap={12} style={RowStyles}>
  <Text>TV Shows</Text>
  <Text>Movies</Text>
  <Text>Sports</Text>
  <Text>News</Text>
</View>;
```

Additionally, flex will automatically layout Text nodes. Anytime a View with display: flex has children which are text nodes it adds a listener for the text to load to set the width and height of the text elements and then calls `updateLayout` on the container to recalculate the flex layout.

### Flex Properties

- `alignItems`: 'flexStart' | 'flexEnd' | 'center'
- `display`: 'flex'
- `flexDirection`: 'row' | 'column'
- `gap`: number
- `justifyContent`: 'flexStart' | 'flexEnd' | 'center' | 'spaceBetween' | 'spaceEvenly'

You can put the following properties on the items to control the layout further.

- `marginBottom`: number
- `marginLeft`: number
- `marginRight`: number
- `marginTop`: number

`alignItems` supports `flexStart`, `flexEnd`, and `center` but requires it's container to have a height / width set.

## Layout Callbacks

When layout occurs on a container with `display: flex` during initial rendering, `updateLayout` is called calculating flex layout. If you want to tie into the layout system you can use `onBeforeLayout` and `onLayout` hooks to update the element with the following signature `(node, { width, height})`. You can use this callback to resize the parent node before flex is calculated using `onBeforeLayout` and after flex with `onLayout`. If you do, call `parent.updateLayout` for it to also resize.

Additionally, if you ever reason a child element, call `updateLayout` on the parent to perform layout.
