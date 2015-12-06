'use strict'

import test from 'ava'
import {create} from '../lib'

test('the create method is a function', t => {
  t.is(typeof create, 'function')
  t.pass()
})

test('the create methods returns an object, and has current api', t => {
  const componentServer = create()
  t.is(typeof componentServer, 'object')
  t.is(typeof componentServer.get, 'function')
  t.is(typeof componentServer.renderComponent, 'function')
  t.is(typeof componentServer.isValidSetup, 'function')
  t.is(typeof componentServer.isValidRequire, 'function')
  t.is(typeof componentServer.onError, 'function')
  t.is(typeof componentServer.isValidSetup, 'function')
  t.is(typeof componentServer.isValidRequire, 'function')
  t.is(typeof componentServer.handleRoute, 'function')
  t.is(typeof componentServer.listen, 'function')
  t.pass()
})

test('the componentServer::get method should add a route to a express server', t => {
  const componentServer = create({server: {get: function (url, handler) {
    t.is(url, 'foo')
    t.is(typeof handler, 'function')
    t.pass()
  }}})
  componentServer.get('foo')
})

test('the componentServer::isValidRequire method should return a promise', t => {
  const componentServer = create({server: {}})
  const foo = componentServer.isValidRequire('')
  t.is(typeof foo.then, 'function')
  foo.then(() => {}, (err) => {
    t.is(typeof err, 'object')
    t.pass()
  })
})
