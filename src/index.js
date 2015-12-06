import React from 'react'
import ReactDOMServer from 'react-dom/server'
import browserify from 'browserify'
import express from 'express'
import path from 'path'
import fs from 'fs'
import {EventEmitter} from 'events'
import {safeStringify} from './safe-stringify'
import {isValidSetup} from './validate'

/**
 * create, this will setup this a higher level function that returns a component server
 *
 * @param {Object} options - a set of options to configure defaults of server
 * @param {string} options.componentsDir - the relative path from process.cwd() to components directory
 * @param {string} options.templatesDir - the relative path from process.cwd() to templates directory
 * @param {string} options.[server] - a express server object
 * @param {Object} options.[defaults] - default set of params for paths
 * @param {string} options.[defaults.component] - the component to use if none is passed
 * @param {string} options.[defaults.template] - the template to use if none is passed
 * @param {Object} options.[defaults.params] - the props to use if none is passed
 * @returns {Object} reactComponentServer - a new instance of a component server
 */

function create (options = {}) {
  const expressApp = options.server || express()
  const errorMessage = options.errorMessage || 'An error happened'
  const doctype = options.doctype || '<!doctype html>'
  const defaults = options.defaults || {}
  const bundleDir = options.bundleDir || '/js'
  const bundleExpose = options.bundleExpose || 'app'
  const cacheDir = options.cacheDir || './temp'
  const dirs = {
    component: path.resolve(process.cwd(), options.componentsDir || './components'),
    template: path.resolve(process.cwd(), options.templatesDir || './templates')
  }

  class ReactComponentServer extends EventEmitter {
    /**
     * ::constructor - sets up components server, initializes EventEmitter, and exposes expressApp
     */
    constructor () {
      super()
      this.expressApp = expressApp // expose this
    }
    /**
     * ::get The only METHOD of express proxied
     *
     * @param {string} path - the path to handle when the server get a request to it. eg. "/about"
     * @param {mixed} args - the rest of the arguments proxied to handleRoute. see for more details
     */
    get (path, ...args) {
      expressApp.get(path, this.handleRoute(...args))
    }
    /**
     * ::renderComponent - takes inputed options validate and then renders out components and places in template sends back to request
     *
     * @param  {object} options - an object that holds the config for the request
     * @param  {mixed} options.[param] - please see defaults for create for more details
     */
    renderComponent (options, res) {
      isValidSetup(options, {defaults, dirs}, (err, requires) => {
        if (err) {
          return this.onError(err, res)
        }
        const Component = requires.component
        const {template, componentPath} = requires
        const {props, meta} = options
        const _meta = Object.assign({}, meta, this.getBundleMeta({componentPath}))
        console.log('bundling')
        this.bundleJS(componentPath, {
          expose: _meta.bundleExpose,
          bundlePath: _meta.bundlePath,
          cachePath: cacheDir
        }, () => {
          console.log('bundle done')
          const _template = template(ReactDOMServer.renderToString(<Component {...props} />), {props, meta: _meta})
          const html = ReactDOMServer.renderToStaticMarkup(_template)
          res.send(`${doctype}${html}`)
          this.get(_meta.bundlePath, this.handleBundleRoute(cacheFile)) // add a route
        })
      })
    }
    getBundleMeta ({componentPath}) {
      const _fileName = componentPath.split('/').pop()
      const fileName = _fileName.match(/\.js$/) ? _fileName : `${_fileName}.js`
      const bundlePath = bundleDir.match(/\/$/) ? bundleDir : `${bundleDir}/`
      return {
        bundlePath: `${bundlePath}${fileName}`,
        bundleExpose: bundleExpose
      }
    }
    bundleJS (componentPath, {expose, cachePath, bundlePath}, callback) {
      console.log('in bundleJS')
      const bundle = browserify()
      const fileName = bundlePath.split('/').pop()
      const cacheFile = `${cachePath}/${fileName}`
      const _componentBase = componentPath.split('/')
      _componentBase.pop()
      const basedir = _componentBase.join('/')
      // const rs = fs.createReadStream(componentPath)
      const ws = fs.createWriteStream(cacheFile)
      console.log('start actual bundle')
      bundle.require(componentPath, {expose, basedir})
      bundle
        .bundle((err, buf) => {
          console.log('bundle callback')
          if (err) {
            this.onError(err)
            callback(err)
            return console.log(err)
          }
          ws.write(buf)
          ws.end()
          callback()
        })
    }
    handleBundleRoute (cacheFile) {
      return (req, res) => {
        const rs = fs.createReadStream(cacheFile)
        rs
          .on('error', (err) => {
            this.onError(err, res)
          })
          .pipe(res)
      }
    }
    /**
     * ::onError - is a method that simplifys error handling inside of components, with show errors on dev, and hide them on prod. Also looks to see if there is a error event binding
     *
     * @param {Error} err - an error object
     * @param {Object} res - an http res object with express sugar
     */
    onError (err, res) {
      if (this.listeners('error').length) {
        if (res) {
          res
            .status(500)
            .send(`<h3>${process.env !== 'production' ? `${err.message}<br>${err.stack}` : errorMessage}</h3>`)
        }
        return this.emit('error', err)
      }
      console.error(`Unhandled 'error' event`)
      throw err
    }
    /**
     * ::handleRoute - handles the express route and sets up options for renderComponent
     *
     * @param  {Object|Function|undefined} options - can be a number of types resolves to being an object
     * @param {function|undefined} handler - is a function to call to get/overwrite options
     */
    handleRoute (options = {}, handler) {
      // handles function second param
      if (typeof options === 'function') {
        handler = options
        options = {}
      }
      return (req, res) => {
        if (typeof handler === undefined) {
          return this.renderComponent(options, res)
        }
        handler(req, res, (_opts = {}) => {
          this.renderComponent(_opts, res)
        })
      }
    }
    /**
     * listen - a proxy for express's listen method
     *
     * @param {number} port - a port number to listen on
     * @param {Function} [callback] - a callback to call after port is listening
     */
    listen (port, callback) {
      expressApp.listen(port, callback)
    }
  }

  return new ReactComponentServer()
}

export {create, safeStringify}
