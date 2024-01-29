# Transitions / Animations

Transitions allow you to change properties smoothly over time. You can define which properties will animate via the `transition` property along with setting custom `animationSettings`. If you wish to reuse or use the default `animationSettings`, you can set the property value to `true`.

```jsx
createEffect(on(activeElement, (elm) => {
    focusRingRef.x = elm.x;
}, { defer: true}))

<FocusRing ref={focusRingRef} transition={{ x: true, scale: { duration: 1500, easing: 'ease-in-out'} }} />
```

Transition can also be set in the style object and you have control over multiple properties:

```jsx
const buttonStyle = {
  ...
  transition: {
    scale: { duration: 200, easing: 'ease-out'},
    alpha: { duration: 200, easing: 'ease-out'}
  }
}
```

Additionally, if you want all properties to transition you can set `transition: true` and an `animationSettings` property on the component to use for all transitions.

## Direct Animations

For more complicated animations, you can access the Lightning renderer animate API directly:

```jsx
let button;

onMount(() => {
  button.animate({ alpha: 1, scale: 1.1 }, { duration: 500 }).start();
});
<Button ref={button}>Movies</Button>;
```

To find out more about animations check out the [renderer example](https://github.com/lightning-js/renderer/blob/main/examples/tests/animation.ts#L70).

## Default Animation Settings

You can set default animation settings for all transitions globally via Config.

```js
import { Config } from '@lightningjs/solid';
Config.animationSettings = {
  duration: 250,
  delay: 0,
  repeat: 0,
  loop: false,
  stopMethod: false,
  easing: 'ease-in-out',
};
```

Also you can disable all transitions with `Config.animationsEnabled = false`. This will not disable calls to `.animate`.
