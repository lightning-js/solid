export function withPadding(el, padding) {
  const pad = padding();
  let top, left, right, bottom;

  if (Array.isArray(pad)) {
    // top right bottom left
    if (pad.length === 2) {
      top = bottom = pad[0];
      left = right = pad[1];
    } else if (pad.length === 3) {
      top = pad[0];
      left = right = pad[1];
      bottom = pad[2];
    } else {
      [top, right, bottom, left] = pad;
    }
  } else {
    top = right = bottom = left = pad;
  }

  el.onLayout = (node, size) => {
    if (size) {
      el.width = size.width + left + right;
      el.height = size.height + top + bottom;

      node.x = left;
      node.y = top;

      el.parent.updateLayout(el, { width: el.width, height: el.height });
    }
  };
}
