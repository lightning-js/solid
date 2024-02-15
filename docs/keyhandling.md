# Focus / Key Handling (or Remotes)

## activeElement

At any time there is only one element that can have focus, the activeElement. `activeElement` is a global Solid Signal that points to the element with focus. You can also set focus to any element using `setActiveElement` or calling `elm.setFocus()`

```jsx
import { createEffect, on } from "solid-js";
import { activeElement, setActiveElement } from "@lightningjs/solid";

// Get notified whenever the activeElement changes
createEffect(on(activeElement, (elm) => {
    focusRingRef.x = elm.x;
}, { defer: true}))

// autofocus attribute will setActiveElement on this when intially created
<Button autofocus>TV Shows</Button>


let myButton;
onMount(() => {
  myButton.setFocus();
  // DONT Do This (prefer to use setFocus so forwardFocus works)
  setActiveElement(myButton)
})
<Button ref={myButton}>Sports</Button>
```

## forwardFocus

Sometimes an element is being focused via `setFocus` but you really want a child element to receive focus. In that case `forwardFocus={childIndexNumber}` will skip setting activeElement on this element and instead setFocus on `this.children[childIndexNumber]`. If you have more complicated needs, `forwardFocus` also takes a function for you to setFocus on any element you want or you can return false from the function for that element to receive focus.

```jsx
  // Focus on the column but then focus on first child
  <Column autofocus forwardFocus={0}>
```

## Key Handling

In order to handle input from users, you'll need to add the `useFocusManager` primitive.

```sh
> npm i @lightningjs/solid-primitives
```

### useFocusManager

`useFocusManager` adds key handling, focusPath tracking, and focus and blur events on components, and is setup once on app initialization. It returns a signal, focusPath which is an array of elements that currently have focus. When `activeElement` changes, the focusPath will be recalculated. During which all elements in focus will have a `focus` state added and `onFocus(currentFocusedElm, prevFocusedElm)` event called. Elements losing focus will have `focus` state removed and `onBlur(currentFocusedElm, prevFocusedElm)` called.

```jsx
import { useFocusManager } from "@lightningjs/solid-primitives";

const App = () => {
  const focusPath = useFocusManager({
    Announcer: 'a',
    Menu: 'm',
    Text: 't',
    Buttons: 'b',
  });

  ...
}
```

The calculated focusPath is used for handling key events. When a key is pressed, the `keyMap` looks for the keyName and corresponding value to call `on${key}` first, then a generic `onKeyPress` on the activeElement, and then every parent until the keypress is handled. To handle a keypress and stop propagation, the handler must return `true`. Any other return value or no return value will continue the going through the focusPath looking for additional handlers. If you have multiple keys to use for a single event pass in an Array of keys. (Left: ['ArrowLeft', 37]).

The custom keys object will be merged with the default key mapping:

```js
const defaultKeyMap = {
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  Enter: 'Enter',
  ' ': 'Space',
  Backspace: 'Back',
  Escape: 'Escape',
  37: 'Left',
  39: 'Right',
  38: 'Up',
  40: 'Down',
  13: 'Enter',
  32: 'Space',
  8: 'Back',
  27: 'Escape',
};
```
