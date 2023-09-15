/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderer, makeShader } from '../render';
import Children from './children';
import States from './states';
import calculateFlex from '../flex';
import {
  normalizeColor,
  log,
  isFunc,
  isObject,
  isArray,
  keyExists,
} from '../utils';
import { config } from '../../config';
import { setActiveElement } from '../activeElement';

const { animationSettings: defaultAnimationSettings } = config;

function normalizeProps(obj) {
  const props = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isFunc(value) || key.startsWith('_') || isObject(value)) {
      //Filter out functions and private vars and sub objects
      continue;
    }
    props[key] = key.startsWith('color') ? normalizeColor(value) : value;
  }
  return props;
}

function convertEffectsToShader(styleEffects) {
  const effects = [];

  for (const [type, props] of Object.entries(styleEffects)) {
    effects.push({ type, props: normalizeProps(props) });
  }
  return makeShader('DynamicShader', { effects });
}

const CORE_PROPS = ['texture', 'shader', 'effects', 'src', 'parent'];
function forwardToLightning(node, name, value) {
  let props;
  if (name === 'parent') {
    props = { parent: value.lng };
  } else if (name === 'effects') {
    props = { shader: convertEffectsToShader(value) };
  } else if (CORE_PROPS.includes(name)) {
    props = { [name]: value };
  } else if (isFunc(value)) {
    return;
  } else if (isArray(value)) {
    let prop = normalizeProps({ [name]: value[0] });
    const settings = value[1] || node.animationSettings;
    return node.lng.animate(prop, settings).start();
  } else if (isObject(value)) {
    props = normalizeProps(value);
  } else {
    props = normalizeProps({ [name]: value });
  }

  if (node._animate && !CORE_PROPS.includes(name)) {
    node.lng.animate(props, node.animationSettings).start();
  } else {
    Object.assign(node.lng, props);
  }
}

const DONT_FORWARD = ['selected'];
const NodeHandler = {
  set(node, name, value) {
    if (node.lng && !name.startsWith('_') && !DONT_FORWARD.includes(name)) {
      forwardToLightning(node, name, value);
    }

    node[name] = value;
    return true;
  },
};

export default function Node(name, lng) {
  const node = new Proxy(this, NodeHandler);
  Object.defineProperties(this, {
    name: {
      value: name,
      enumerable: false,
    },
    lng: {
      value: lng,
      writable: true,
      enumerable: false,
    },
    children: {
      value: new Children(node),
      enumerable: false,
    },
    hasChildren: {
      enumerable: false,
      get() {
        return this.children.length > 0;
      },
    },
    forwardStates: {
      enumerable: false,
      writable: true,
    },
    states: {
      enumerable: false,
      set(v) {
        this._states = new States(node, v);
        if (this.lng) {
          node._stateChanged();
        }
      },
      get() {
        this._states = this._states || new States(node);
        return this._states;
      },
    },
    parent: {
      writable: true,
      enumerable: false,
    },
    shader: {
      writable: true,
      enumerable: false,
    },
    style: {
      writable: true,
      enumerable: false,
    },
    stateStyles: {
      writable: true,
      enumerable: false,
    },
    animationSettings: {
      get() {
        return this._animationSettings || defaultAnimationSettings;
      },
      set(v) {
        this._animationSettings = v;
      },
      enumerable: false,
    },
    updateLayoutOn: {
      get() {
        return this._updateLayoutOn;
      },
      set(v) {
        this._updateLayoutOn = v;
        queueMicrotask(() => this.updateLayout());
      },
      enumerable: false,
    },
  });
  return node;
}

Node.prototype.animate = function (props, animationSettings) {
  return this.lng.animate(props, animationSettings || this.animationSettings);
};

Node.prototype.setFocus = function () {
  setActiveElement(this);
};

Node.prototype.getProps = function () {
  return normalizeProps(this);
};

Node.prototype.isTextNode = function () {
  return this.name === 'text';
};

Node.prototype.getText = function () {
  return this.children.map((c) => c.text).join('');
};

Node.prototype.destroy = function () {
  this.lng && renderer.destroyNode(this.lng);
};

Node.prototype._stateChanged = function () {
  log('State Changed: ', this, this.states);

  if (this.forwardStates) {
    // apply states to children first
    const states = this.states.slice();
    this.children.forEach((c) => (c.states = states));
  }

  if (this._undoStates || (this.style && keyExists(this.style, this.states))) {
    this._undoStates = this._undoStates || {};
    let stylesToUndo = {};

    for (const [state, undoStyles] of Object.entries(this._undoStates)) {
      // if state is no longer in the states undo it
      if (!this.states.includes(state)) {
        stylesToUndo = {
          ...stylesToUndo,
          ...undoStyles,
        };
      }
    }

    const newStyles = this.states.reduce((acc, state) => {
      const styles = this.style[state];
      if (styles) {
        acc = {
          ...acc,
          ...styles,
        };

        // get current values to undo state
        if (!this._undoStates[state]) {
          this._undoStates[state] = {};
          Object.keys(styles).forEach((key) => {
            this._undoStates[state][key] = this[key];
          });
        }
      }
      return acc;
    }, {});

    Object.assign(this, { ...stylesToUndo, ...newStyles });
  }
};

Node.prototype._applyZIndexToChildren = function () {
  const zIndex = this.zIndex;
  const zIndexIsInteger = zIndex >= 1 && parseInt(zIndex) === zIndex;
  const decimalSeparator = zIndexIsInteger ? '.' : '';

  this.children.forEach((c, i) => {
    if (!c.zIndex || c.zIndex < 1) {
      c.zIndex = parseFloat(`${zIndex}${decimalSeparator}${i + 1}`);
    }
  });
};

Node.prototype.updateLayout = function () {
  if (this.display === 'flex' && this.hasChildren) {
    log('Layout: ', this);
    calculateFlex(this);
  }
};

Node.prototype.render = function () {
  const node = this;
  const { parent } = this;
  node.x = node.x || 0;
  node.y = node.y || 0;

  // Parent is dirty whenever a node is inserted after initial render
  if (parent._isDirty) {
    node.parent.updateLayout();
    parent._applyZIndexToChildren();
    parent._isDirty = false;
  }

  node.updateLayout();

  if (this.states.length) {
    this._stateChanged();
  }

  let props = node.getProps();

  if (node.shader) {
    props.shader = makeShader(...node.shader);
  }

  if (node.effects) {
    props.shader = convertEffectsToShader(node.effects);
  }

  if (parent.lng) {
    props.parent = parent.lng;
  }

  if (node.isTextNode()) {
    props = {
      ...config.fontSettings,
      ...props,
    };
    log('Rendering: ', node.name, props);
    node.lng = renderer.createTextNode(props);

    if (node.onLoad) {
      node.lng.once('textLoaded', node.onLoad);
    }

    if (!node.width || !node.height) {
      node.lng.on('textLoaded', (elm, { width, height }) => {
        node.width = width;
        node.height = height;
        node.parent.updateLayout();
      });
    }
  } else {
    if (isNaN(props.width) || isNaN(props.height)) {
      console.warn(
        `${node.name} may not be rendered - missing width and height`,
      );
    }

    log('Rendering: ', node.name, props);
    node.hasChildren && node._applyZIndexToChildren();
    node.lng = renderer.createNode(props);

    if (node.onLoad) {
      node.lng.once('txLoaded', node.onLoad);
    }
  }

  node.autofocus && node.setFocus();
};
