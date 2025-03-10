// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Important: This code does not actually run any tests but is used to verify
//            that the type magic of `EventTarget` behaves as expected w.r.t
//            to the TypeScript compiler.

import * as Common from '../../../../../front_end/core/common/common.js';

const enum Events {
  VoidEvent = 'VoidEvent',
  NumberEvent = 'NumberEvent',
  KeyValueEvent = 'KeyValueEvent',
  BooleanEvent = 'BooleanEvent',
}

type TestEvents = {
  [Events.VoidEvent]: void,
  [Events.NumberEvent]: number,
  [Events.KeyValueEvent]: {key: string, value: number},
  [Events.BooleanEvent]: boolean,
};

class TypedEventEmitter extends Common.ObjectWrapper.ObjectWrapper<TestEvents> {
  testValidArgumentTypes() {
    this.dispatchEventToListeners(Events.VoidEvent, undefined);
    this.dispatchEventToListeners(Events.NumberEvent, 5.0);
    this.dispatchEventToListeners(Events.KeyValueEvent, {key: 'key', value: 42});
    this.dispatchEventToListeners(Events.BooleanEvent, true);
  }

  testInvalidArgumentTypes() {
    // @ts-expect-error string instead of undefined provided
    this.dispatchEventToListeners(Events.VoidEvent, 'void');

    // @ts-expect-error string instead of number provided
    this.dispatchEventToListeners(Events.NumberEvent, 'expected number');

    // @ts-expect-error wrong object type provided as payload
    this.dispatchEventToListeners(Events.KeyValueEvent, {key: 'key', foo: 'foo'});
  }

  testStringAndSymbolDisallowed() {
    // @ts-expect-error only keys of `TestEvents` are allowed.
    this.dispatchEventToListeners('foo');

    // @ts-expect-error only keys of `TestEvents` are allowed.
    this.dispatchEventToListeners(Symbol('foo'));
  }
}

class UntypedEventEmitter extends Common.ObjectWrapper.ObjectWrapper {
  testDispatch() {
    this.dispatchEventToListeners('foo');
    this.dispatchEventToListeners(Symbol('number payload'), 25);
    this.dispatchEventToListeners(Events.VoidEvent);
  }
}

function genericListener<T>(): (arg: Common.EventTarget.EventTargetEvent<T>) => void {
  return (_arg: Common.EventTarget.EventTargetEvent<T>) => {};
}

const typedEmitter = new TypedEventEmitter();

(function testValidListeners() {
  typedEmitter.addEventListener(Events.VoidEvent, genericListener<void>());
  typedEmitter.addEventListener(Events.NumberEvent, genericListener<number>());
  typedEmitter.addEventListener(Events.KeyValueEvent, genericListener<{key: string, value: number}>());
  typedEmitter.addEventListener(Events.BooleanEvent, genericListener<boolean>());
})();

(function testInvalidListenerArguments() {
  // @ts-expect-error
  typedEmitter.addEventListener(Events.VoidEvent, genericListener<number>());

  // @ts-expect-error
  typedEmitter.addEventListener(Events.NumberEvent, genericListener<void>());

  // @ts-expect-error
  typedEmitter.addEventListener(Events.KeyValueEvent, genericListener<{foo: string}>());
})();

(function testInvalidListenerType() {
  // @ts-expect-error
  typedEmitter.addEventListener('foo', genericListener());

  // @ts-expect-error
  typedEmitter.addEventListener(Symbol('foo'), genericListener());
})();

const untypedEmitter = new UntypedEventEmitter();

(function testUntypedListeners() {
  untypedEmitter.addEventListener('foo', genericListener());
  untypedEmitter.addEventListener(Symbol('foo'), genericListener());
  untypedEmitter.addEventListener(Events.VoidEvent, genericListener());
})();
