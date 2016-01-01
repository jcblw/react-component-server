'use strict'

// monkey patch babel
import 'babel-core/register'

import test from 'ava'
import path from 'path'
import through from 'through'
import {create} from '../src'

function noop () {}

test('the create method is a function', t => {
  t.is(typeof create, 'function')
  t.pass()
})

test('the create methods returns an object, and has current api', t => {
  const componentServer = create()
  t.is(typeof componentServer, 'object')
  t.is(typeof componentServer.get, 'function')
  t.is(typeof componentServer.renderComponent, 'function')
  t.is(typeof componentServer.getHTML, 'function')
  t.is(typeof componentServer.onError, 'function')
  t.is(typeof componentServer.handleRoute, 'function')
  t.is(typeof componentServer.listen, 'function')
  t.pass()
})

test('the componentServer::get method should add a route to the router', t => {
  const componentServer = create({server: {on: noop}})
  componentServer.get('foo')
  t.is(typeof componentServer.router.hash._hash.staticPaths.foo, 'object')
  t.pass()
})

test('the componentServer::listen method should pass port to the http server', t => {
  const componentServer = create({server: {
    listen: function (port) {
      t.is(port, 1337)
      t.pass()
    },
    on: noop
  }})
  componentServer.listen(1337)
})

test('the componentServer::renderComponent method should call the callback with an error if an invalid configuration is passed', t => {
  const componentServer = create({server: {on: noop}})
  componentServer.renderComponent({}, function (err) {
    t.is(typeof err, 'object')
    t.true(!!err.message.match(/ENOENT/))
    t.pass()
  })
})

test('the componentServer::renderComponent method should generate html when a valid configuration is passed', t => {
  const componentServer = create({
    server: {on: noop},
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  componentServer.renderComponent({
    component: 'App.js',
    template: '_layout.js'
  }, (err, html) => {
    t.notOk(err)
    t.is(typeof html, 'string')
    t.ok(html.match(/Foo Bar/))
    t.ok(html.match(/\<\!doctype html\>/))
    t.pass()
  })
})

test('the componentServer::getHTML method should be a proxy to the ::renderComponent method', t => {
  const componentServer = create({
    server: {on: noop},
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  const _options = {foo: 'bar'}
  const done = (foo) => {
    t.is(foo, 'bar')
    t.pass()
  }
  componentServer.renderComponent = (options, callback) => {
    t.is(options.foo, 'bar')
    t.is(typeof callback, 'function')
    callback('bar')
  }
  componentServer.getHTML(_options, done)
})

test('the componentServer::getBundleMeta method should return an object with the keys bundlePath and bundleExpose', t => {
  const componentServer = create({
    server: {on: noop},
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  const meta = componentServer.getBundleMeta({componentPath: './App.js'})
  t.is(typeof meta, 'object')
  t.true(meta.hasOwnProperty('bundlePath'))
  t.true(meta.hasOwnProperty('bundleExpose'))
  t.pass()
})

test('the componentServer::registerBundle should register a get url with the server that points towards the bundle path', t => {
  const componentServer = create({server: {on: noop}})
  componentServer.registerBundle('', {bundlePath: 'bar'})
  t.is(typeof componentServer.router.hash._hash.staticPaths.bar, 'object')
  t.pass()
})

test.cb('the componentServer::registerBundle should build a bundle, with all the proper exports, when a request for the bundle path is made', t => {
  let hasReact
  let hasReactDOM
  let hasComponent
  const spy = through(function spyWrite (chunk) {
    const str = chunk.toString()
    hasReact = hasReact || !!str.match('react')
    hasReactDOM = hasReactDOM || !!str.match('react-dom')
    hasComponent = hasComponent || !!str.match('qux')
    this.queue(chunk)
  }, () => {
    if (hasReact && hasReactDOM && hasComponent) {
      t.pass()
    } else {
      t.fail()
    }
    t.end()
  })
  const componentServer = create({
    server: {on: noop}
  })
  componentServer.registerBundle(path.resolve(process.cwd(), './test-components/App.js'), {
    bundlePath: 'foo',
    expose: 'qux'
  })
  // fake req
  componentServer.router.hash._hash.staticPaths.foo.handler({}, spy)
})

test.cb('the componentServer::registerBundle should emit an error if there is a browserify bundle error', t => {
  const spyResponse = {
    on: function () {},
    once: function () {},
    emit: function () {},
    status: function (status) {},
    end: function (html) {}
  }
  const componentServer = create({server: {on: noop}})
  componentServer.on('error', (err, res) => {
    t.is(typeof err, 'object')
    t.ok(err.message.match(/Cannot find module/))
    t.end()
  })
  componentServer.registerBundle(path.resolve(process.cwd(), './test-components/NotFound.js'), {
    bundlePath: 'foo',
    expose: 'qux'
  })
  // fake req
  componentServer.router.hash._hash.staticPaths.foo.handler({}, spyResponse)
})

test('the componentServer::onError method should throw if there is no "error" event listeners', t => {
  const componentServer = create({server: {on: noop}})
  t.throws(() => { componentServer.onError(new Error('foo')) }, /foo/)
  t.pass()
})

test('the componentServer::onError method should not throw if there are "error" event listeners', t => {
  const componentServer = create({server: {on: noop}})
  componentServer.on('error', err => { t.ok(err.message.match(/foo/)) })
  t.doesNotThrow(() => { componentServer.onError(new Error('foo')) })
  t.pass()
})

test('the componentServer::handleRoute method should return a function', t => {
  const componentServer = create({server: {on: noop}})
  t.is(typeof componentServer.handleRoute(), 'function')
})

test('the componentServer::handleRoute methods returned function should emit an error if there is a bad configuration passed to the intial function', t => {
  const componentServer = create({server: {on: noop}})
  const handle = componentServer.handleRoute()
  componentServer.on('error', err => { t.pass(err) })
  handle()
})

test('the componentServer::handleRoute methods returned function should send back html to the response if the configuration is correct', t => {
  const spyResponse = {
    on: function () {},
    once: function () {},
    emit: function () {},
    status: function (status) {},
    end: function (html) {
      t.ok(html.match(/\<\!doctype html\>/))
      t.pass()
    }
  }
  const componentServer = create({
    server: {on: noop},
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  const handle = componentServer.handleRoute({
    component: 'App.js',
    template: '_layout.js'
  })
  handle({}, spyResponse)
})

test.cb('the componentServer::handleRoute methods returned function should register a bundle if the option bundle is passed to the initial method', t => {
  const spyResponse = {
    on: function () {},
    once: function () {},
    emit: function () {},
    status: function () {},
    end: function () {}
  }
  const componentServer = create({
    server: {
      on: noop
    },
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  componentServer.router.set = function (url, handler) {
    t.is(typeof url, 'string')
    t.ok(url.match(/\/js\/App\.js/))
    t.is(typeof handler, 'function')
    t.pass()
    t.end()
  }
  const handle = componentServer.handleRoute({
    bundle: true,
    component: 'App.js',
    template: '_layout.js'
  })
  handle({}, spyResponse)
})

test.cb('the componentServer::handleRoute methods returned function should wait for an initial function to be called to render component', t => {
  const spyResponse = {
    on: function () {},
    once: function () {},
    emit: function () {},
    status: function (status) {},
    end: function (html) {
      t.ok(html.match(/\<\!doctype html\>/))
      t.pass()
      t.end()
    }
  }
  const componentServer = create({
    server: {on: noop},
    componentsDir: './test-components/',
    templatesDir: './test-templates/'
  })
  const handle = componentServer.handleRoute((req, res, done) => {
    setTimeout(() => {
      done({
        component: 'App.js',
        template: '_layout.js'
      })
    }, 300)
  })
  handle({}, spyResponse)
})
