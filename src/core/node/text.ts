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

import BaseNode from './base.js';
import { type TextStyles } from '../../index.js';
import { log } from '../utils.js';
import { config } from '../../config.js';
import { TextHolder } from './textHolder.js';
import type {
  INode,
  RendererMain,
  NodeLoadedPayload,
} from '@lightningjs/renderer';

export class TextNode extends BaseNode<TextHolder> {
  private _renderProps?: TextStyles;
  _style?: TextStyles;
  text?: string;

  constructor() {
    super();
    this._renderProps = { x: 0, y: 0 };
  }

  _resizeOnTextLoad(): void {
    this.lng!.once(
      'loaded',
      (_node: INode, loadedPayload: NodeLoadedPayload) => {
        if (loadedPayload.type === 'text') {
          const { dimensions } = loadedPayload;

          this.width = dimensions.width;
          this.height = dimensions.height;
          this.parent!.updateLayout(this, dimensions);
        }
      },
    );
  }

  getText(): string {
    return this.children.map((c) => c.text).join('');
  }

  setProperty(name: string, value: any = true): void {
    if (this.rendered) {
      this.lng[name] = value;
    } else {
      this._renderProps[name] = value;
    }
  }

  set style(value: TextStyles) {
    // Keys set in JSX are more important
    for (const key in value) {
      if (!this[key as keyof TextStyles]) {
        this[key as keyof TextStyles] = value[key as keyof TextStyles];
      }
    }
    this._style = value;
  }

  get style(): TextStyles {
    return this._style;
  }

  render(renderer: RendererMain) {
    const parent = this.parent!;

    if (this.states.length) {
      this._stateChanged();
    }

    if (parent.lng) {
      this._renderProps.parent = parent.lng;
    }

    this._renderProps = {
      ...config.fontSettings,
      ...this._renderProps,
      text: this.getText(),
    };

    log('Rendering: ', this, this._renderProps);
    this.lng = renderer.createTextNode(this._renderProps);

    if (!this.width || !this.height) {
      this._autosized = true;
      this._resizeOnTextLoad();
    }

    this.rendered = true;
    // clean up after first render;
    delete this._renderProps;
  }
}
