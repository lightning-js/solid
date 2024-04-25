/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { config, isDev } from './config.js';
import type { SolidNode, SolidStyles } from './node/elementNode.js';

function hasDebug(node: any) {
  return isObject(node) && node.debug;
}

export function log(msg: string, node: SolidNode, ...args: any[]) {
  if (isDev) {
    if (config.debug || hasDebug(node) || hasDebug(args[0])) {
      console.log(msg, node, ...args);
    }
  }
}

export function isFunc(item: unknown): item is (...args: unknown[]) => unknown {
  return typeof item === 'function';
}

export function isObject(
  item: unknown,
): item is Record<string | number | symbol, unknown> {
  return typeof item === 'object';
}

export function isArray(item: unknown): item is any[] {
  return Array.isArray(item);
}

export function isString(item: unknown): item is string {
  return typeof item === 'string';
}

export function isNumber(item: unknown): item is number {
  return typeof item === 'number';
}

export function isInteger(item: unknown): item is number {
  return Number.isInteger(item);
}

export function keyExists(
  obj: Record<string, unknown>,
  keys: (string | number | symbol)[],
) {
  for (const key of keys) {
    if (key in obj) {
      return true;
    }
  }
  return false;
}

export function flattenStyles(
  obj: SolidStyles | undefined | (SolidStyles | undefined)[],
  result: Record<string, unknown> = {},
): SolidStyles {
  if (isArray(obj)) {
    obj.forEach((item) => {
      flattenStyles(item, result);
    });
  } else if (obj) {
    // handle the case where the object is not an array
    for (const key in obj) {
      // be careful of 0 values
      if (result[key as keyof SolidStyles] === undefined) {
        result[key as keyof SolidStyles] = obj[key as keyof SolidStyles];
      }
    }
  }

  return result;
}

/**
 * Converts a color string to a color number value.
 */
export function hexColor(color: string | number = ''): number {
  if (isInteger(color)) {
    return color;
  }

  if (typeof color === 'string') {
    // Renderer expects RGBA values
    if (color.startsWith('#')) {
      return Number(
        color.replace('#', '0x') + (color.length === 7 ? 'ff' : ''),
      );
    }

    if (color.startsWith('0x')) {
      return Number(color);
    }
    return Number('0x' + (color.length === 6 ? color + 'ff' : color));
  }

  return 0x00000000;
}

/**
 * Converts degrees to radians
 */
export function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}
