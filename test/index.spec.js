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
  t.is(typeof componentServer.onError, 'function')
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

test('the componentServer::listen method should pass port to the express server', t => {
  const componentServer = create({server: {listen: function (port) {
    t.is(port, 1337)
    t.pass()
  }}})
  componentServer.listen(1337)
})
