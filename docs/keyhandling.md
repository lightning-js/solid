# Focus / Key Handling (or Remotes)

## Focus (activeElement)

In order to handle input from users, you'll need to add the `useFocusManager` primitive.

```sh
> npm i @lightningjs/solid-primitives
```

## useFocusManager

`useFocusManager` adds key handling, focusPath tracking, and focus and blur events on components. You can do this once in your App component. It returns a signal, focusPath which is an array of elements that currently have focus. When `activeElement` changes, the focusPath will be recalculated. During which all elements in focus will have a `focus` state added and onFocus(currentFocusedElm, prevFocusedElm) event called. Elements losing focus will have `focus` state removed and onBlur(currentFocusedElm, prevFocusedElm) called.

```jsx
import { useFocusManager } from "@lightningjs/solid-primitives";

const App = () => {
  // Only need to do this once in Application, but you can call it anywhere
  // if you need to get the focusPath signal
  const focusPath = useFocusManager(keyMap);
  return ...
}
```

The calculated focusPath is used for handling key events. When a key is pressed, the `keyMap` looks for the keyName and corresponding value to call `on${key}` then `onKeyPress` on each element until one handles the event.

The custom keys object will be merged with the default key mapping, that looks like this:

```js
const defaultKeyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Enter: 'enter',
  ' ': 'space',
  Backspace: 'back',
  Escape: 'escape',
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  13: 'enter',
  32: 'space',
  8: 'back',
  27: 'escape',
};
```
