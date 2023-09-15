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

import SpeechEngine from './Speech.js';
import { debounce } from '@solid-primitives/scheduled';

let resetFocusPathTimer;
let prevFocusPath = [];
let currentlySpeaking;
let voiceOutDisabled = false;
const fiveMinutes = 300000;

const debounceWithFlush = (callback, time) => {
  const trigger = debounce(callback, time);
  let scopedValue;

  const debounced = (newValue) => {
    scopedValue = newValue;
    trigger(newValue);
  };

  debounced.flush = () => {
    trigger.clear();
    callback(scopedValue);
  };

  debounced.clear = trigger.clear;

  return debounced;
};

function getElmName(elm) {
  return elm.id || elm.name;
}

function onFocusChangeCore(focusPath = []) {
  if (!Announcer.enabled) {
    return;
  }

  const loaded = focusPath.every((elm) => !elm.loading);
  const focusDiff = focusPath.filter((elm) => !prevFocusPath.includes(elm));

  resetFocusPathTimer();

  if (!loaded) {
    Announcer.onFocusChange();
    return;
  }

  prevFocusPath = focusPath.slice(0);

  let toAnnounceText = [];
  let toAnnounce = focusDiff.reduce((acc, elm) => {
    if (elm.announce) {
      acc.push([getElmName(elm), 'Announce', elm.announce]);
      toAnnounceText.push(elm.announce);
    } else if (elm.title) {
      acc.push([getElmName(elm), 'Title', elm.title]);
      toAnnounceText.push(elm.title);
    } else {
      acc.push([getElmName(elm), 'No Announce', '']);
    }
    return acc;
  }, []);

  focusDiff.reverse().reduce((acc, elm) => {
    if (elm.announceContext) {
      acc.push([getElmName(elm), 'Context', elm.announceContext]);
      toAnnounceText.push(elm.announceContext);
    } else {
      acc.push([getElmName(elm), 'No Context', '']);
    }
    return acc;
  }, toAnnounce);

  if (Announcer.debug) {
    console.table(toAnnounce);
  }

  if (toAnnounceText.length) {
    return Announcer.speak(
      toAnnounceText.reduce((acc, val) => acc.concat(val), []),
    );
  }
}

function textToSpeech(toSpeak) {
  if (voiceOutDisabled) {
    return;
  }

  return (currentlySpeaking = SpeechEngine(toSpeak));
}

export const Announcer = {
  enabled: true,
  debug: false,
  cancel: function () {
    currentlySpeaking && currentlySpeaking.cancel();
  },
  clearPrevFocus: function (depth = 0) {
    prevFocusPath = prevFocusPath.slice(0, depth);
    resetFocusPathTimer();
  },
  speak: function (text, { append = false, notification = false } = {}) {
    if (Announcer.enabled) {
      Announcer.onFocusChange.flush();
      if (append && currentlySpeaking && currentlySpeaking.active) {
        currentlySpeaking.append(text);
      } else {
        Announcer.cancel();
        textToSpeech(text);
      }

      if (notification) {
        voiceOutDisabled = true;
        currentlySpeaking.series.finally(() => {
          voiceOutDisabled = false;
          Announcer.refresh();
        });
      }
    }

    return currentlySpeaking;
  },
  setupTimers: function ({
    focusDebounce = 400,
    focusChangeTimeout = fiveMinutes,
  } = {}) {
    Announcer.onFocusChange = debounceWithFlush(
      onFocusChangeCore,
      focusDebounce,
    );

    resetFocusPathTimer = debounceWithFlush(() => {
      // Reset focus path for full announce
      prevFocusPath = [];
    }, focusChangeTimeout);
  },
};
