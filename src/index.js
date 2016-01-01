import React from 'react'
import http from 'http'
import HttpHashRouter from 'http-hash-router'
import ReactDOMServer from 'react-dom/server'
import browserify from 'browserify'
import path from 'path'
import {EventEmitter} from 'events'
import {safeStringify} from './safe-stringify'
import {isValidSetup} from './validate'

/**
 * create, this will setup this a higher level function that returns a component server
 *
 * @param {Object} options - a set of options to configure defaults of server
 * @param {string} options.componentsDir - the relative path from process.cwd() to components directory
 * @param {string} options.templatesDir - the relative path from process.cwd() to templates directory
 * @param {string} options.[server] - a http server object
 * @param {Object} options.[defaults] - default set of params for paths
 * @param {string} options.[defaults.component] - the component to use if none is passed
 * @param {string} options.[defaults.template] - the template to use if none is passed
 * @param {Object} options.[defaults.params] - the props to use if none is passed
 * @returns {Object} reactComponentServer - a new instance of a component server
 */

function create (options = {}) {
  const router = HttpHashRouter()
  const doctype = options.doctype || '<!doctype html>'
  const defaults = options.defaults || {}
  const bundleDir = options.bundleDir || '/js'
  const bundleExpose = options.bundleExpose || 'app'
  const {transform, transformOptions} = options
  const dirs = {
    component: path.resolve(process.cwd(), options.componentsDir || './components'),
    template: path.resolve(process.cwd(), options.templatesDir || './templates')
  }

  class ReactComponentServer extends EventEmitter {
    /**
     * ::constructor - sets up components server, initializes EventEmitter, and exposes server
     */
    constructor () {
      super()
      this.onRequest = this.onRequest.bind(this)
      this.server = options.server || http.createServer(this.onRequest)
      this.router = router
      this._bundlePathsRegistered = {}
      if (options.server) {
        this.server.on('request', this.onRequest)
      }
    }
    /**
     * ::get proxy for router.set
     *
     * @param {string} path - the path to handle when the server get a request to it. eg. "/about"
     * @param {mixed} args - the rest of the arguments proxied to handleRoute. see for more details
     */
    get (path, ...args) {
      router.set(path, this.handleRoute(...args))
    }
    /**
     * ::onRequest handles the request and passes the request to the router
     *
     * @param {object} req - an http request object
     * @param {object} res - an http response object
     */
    onRequest (req, res) {
      router(req, res, null, (err) => {
        this.onError(err, res)
      })
    }
    /**
     * ::renderComponent - takes inputed options validate and then renders out components and places in template sends back to request
     *
     * @param {object} options - an object that holds the config for the request
     * @param {mixed} options.[param] - please see defaults for create for more details
     * @param {function} callback - a callback that will return (err, html, requires, meta)
     */
    renderComponent (options, callback) {
      isValidSetup(options, {defaults, dirs}, (err, requires) => {
        if (err) {
          return callback(err)
        }
        const {template, componentPath, component: Component} = requires
        const {props, meta} = options
        const _meta = Object.assign({}, meta, this.getBundleMeta({componentPath}))
        const _props = props || {}
        if (options.bundle) {
          this.registerBundle(componentPath, {
            expose: _meta.bundleExpose,
            bundlePath: _meta.bundlePath
          })
        }
        const _template = template(ReactDOMServer.renderToString(<Component {..._props} />), {props: _props, meta: _meta})
        const html = ReactDOMServer.renderToStaticMarkup(_template)
        callback(null, `${doctype}${html}`, requires, _meta)
      })
    }
    /**
     * ::getHTML - will get the html from the component first checks for cache but the will just render component
     *
     * @param {object} options - config for this component
     * @param {function} callback - a callback function that will return (err, html)
     */
    getHTML (options, callback) {
      // right now this is just a proxy to renderComponent
      const opts = Object.assign({}, defaults, options)
      this.renderComponent(opts, (...args) => {
        callback(...args)
      })
    }
    /**
     * ::getBundleMeta - will grab some meta data about the file that is to be bundled
     *
     * @param {object} options - some of the options
     * @returns {object} bundleMeta - some data about what will be exposed and where the bundle can be fetched from
     */
    getBundleMeta ({componentPath}) {
      const _fileName = componentPath.split('/').pop()
      const fileName = _fileName.match(/\.js$/) ? _fileName : `${_fileName}.js`
      const bundlePath = bundleDir.match(/\/$/) ? bundleDir : `${bundleDir}/`
      return {
        bundlePath: `${bundlePath}${fileName}`,
        bundleExpose: bundleExpose
      }
    }
    /**
     * ::registerBundle - will register a bundle with the router to bundle on request
     *
     * @param {string} componentPath - path to the component
     * @param {object} bundleMeta - some data about what will be exposed and where the bundle can be fetched from
     */
    registerBundle (componentPath, {expose, cachePath, bundlePath}) {
      if (this._bundlePathsRegistered[bundlePath]) return
      this._bundlePathsRegistered[bundlePath] = true
      this.get(bundlePath, (req, res) => {
        // need to implement cache
        const bundle = browserify()

        if (transform) {
          bundle.transform(transform, transformOptions)
        }
        // expose react and react dom
        bundle.require('react', {expose: 'react'})
        bundle.require('react-dom', {expose: 'react-dom'})
        bundle.require(componentPath, {expose})

        bundle
          .bundle()
          .on('error', (e) => this.onError(e, res))
          .pipe(res)
      })
    }
    /**
     * ::onError - is a method that simplifys error handling inside of components, with show errors on dev, and hide them on prod. Also looks to see if there is a error event binding
     *
     * @param {Error} err - an error object
     * @param {Object} res - an http res object with express sugar
     */
    onError (err, res) {
      if (this.listeners('error').length) {
        return this.emit('error', err, res)
      }
      console.error(`Unhandled 'error' event`)
      throw err
    }
    /**
     * ::handleRoute - handles the http route and sets up options for renderComponent
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
        const componentRendered = (err, html, requires, meta) => {
          if (err) {
            return this.onError(err, res)
          }
          res.end(html)
        }
        if (typeof handler !== 'function') {
          return this.getHTML(options, componentRendered)
        }
        handler(req, res, (_opts = {}) => {
          this.getHTML(_opts, componentRendered)
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
      this.server.listen(port, callback)
    }
  }

  return new ReactComponentServer()
}

export {create, safeStringify}
