<p>
  <img src="https://assets.solidjs.com/banner?project=Library&type=solid-lightning" alt="SolidJS Lightning" />
</p>

# solid-lightning

Solid-Lightning is a UI framework for [Lightning Renderer](https://lightningjs.io/) built with [SolidJS](https://www.solidjs.com/) Universal Renderer. It allows you to declaratively construct lightning nodes with reactive primitives, just as you would construct a DOM tree in SolidJS. Also check out [Solid Lightning Primitives](https://github.com/lightning-js/solid-primitives) for additional primitives to speed up your development.

## Documentation

[SolidJS Lightning Docs](https://lightning-js.github.io/solid/)

## Quick Start

Clone starter template:

```sh
> npx degit lightning-js/solid-starter-template my-app
> cd my-app
> npm i # or yarn or pnpm
> npm start # or yarn or pnpm
```

### Hello World

```jsx
import { render, Canvas, Text } from '@lightningjs/solid';

render(() => (
  <Canvas>
    <Text>Hello World</Text>
  </Canvas>
));
```

For a more detailed Hello World guide check out the [Hello World](HelloWorld.md) guide.
