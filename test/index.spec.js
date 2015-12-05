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
  t.pass()
})
