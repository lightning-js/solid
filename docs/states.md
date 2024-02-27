# States

In your application, components can exhibit various states, similar to how a button might be enabled, disabled, or focused. These states enable components to dynamically apply different styles, enhancing their visual representation and behavior based on user interaction or application logic.

States are applied from the style object with a matching name:

```jsx
const Button = {
  width: 386,
  height: 136,
  color: 0x546160ff,
  alpha: 0.8,
  scale: 1,
  $states: {
    focus: {
      color: 0x58807dff,
      scale: 1.1,
      alpha: 1,
    },
    disabled: {
      color: 0x333333ff,
    },
  },
};
```

When Button is focused via the [useFocusManager](./keyhandling.md) the focus state will be added to button causing the focus styles to be applied. And when focus is removed, the original styles on the element will be set. Be sure to set defaults on the original styles if applying a new style via state.

States can be added to components declaritively:

```jsx
<Button states={{ active: true, happy: false, disabled: false }}>Movies</Button>
<Button states={'active'}>Sports</Button>
<Button states='happy'>News</Button>
```

Or imperatively

```jsx
let myButton;

createEffect(() => {
  myButton.states.add('focus');

  // Check for a state
  if(myButton.states.has('focus')) {
    myButton.states.remove('focus')
  }

  myButton.states.add('disabled');
  // is and has are identical
  myButton.states.is('disabled');

  // toggle disabled on / off
  myButton.states.toggle('disabled');
})
<View ref={myButton} style={Button} />
```

Also note if elements are animating and another state is applied during the animation which uses the animated value (say alpha or color) - when that state is removed it will return to some value during the animation. Be careful not to set state with styles that are also being animated.

## stateMapperHook

For further customization of styles using states, you can change the states before styles are applied globally using Config.stateMapperHook. For instance, if you wanted to change your styles based on another property like tone you could do:

```js
import { Config } from '@lightningjs/solid';
Config.stateMapperHook = (node, states) => {
  const tone = node.tone || ''; // node.tone is 'brand'
  return states.map((state) => state + tone);
};
```

Then it would apply `focusbrand` from the styles $states object.

## forwardStates

When you want the state to also be applied to children elements, you can add `forwardStates` attribute to the parent element. Any states set on the parent will be add / removed from the children as well. This is useful for functional components where you need to change styles of children as well.

```jsx
function Button(props) {
  const ButtonContainer = {
    width: 386,
    height: 136,
    color: 0x000000ff,
    alpha: 0.3,
    scale: 1,
    transition: {
      scale: { duration: 1500, delay: 200, easing: 'easy-in' },
      alpha: { duration: 1500, delay: 200, easing: 'easy-in' },
    },
    $states: {
      focus: {
        color: [0x58807dff, { duration: 2000 }],
        scale: 1.2,
        alpha: 1,
      },
    },
  };

  const ButtonText = {
    fontSize: 32,
    lineHeight: Button.height,
    contain: 'width',
    textAlign: 'center',
    mountY: -0.35,
    color: 0xf6f6f9ff,
    height: Button.height,
    width: Button.width,
    $states: {
      focus: {
        color: 0xffffffff,
      },
    },
  };

  return (
    <View {...props} forwardStates style={ButtonContainer}>
      <Text style={ButtonText}>{props.children}</Text>
    </View>
  );
}
```
