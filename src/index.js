import React from 'react'
import ReactDOMServer from 'react-dom/server'
import express from 'express'
import fs from 'fs'
import path from 'path'
import {EventEmitter} from 'events'
import {safeStringify} from './safe-stringify'

function create (options = {}) {
  const expressApp = options.server || express()
  const errorMessage = options.errorMessage || 'An error happened'
  const doctype = options.doctype || '<!doctype html>'
  const defaults = options.defaults || {}
  const dirs = {
    component: path.resolve(process.cwd(), options.componentsDir || './components'),
    template: path.resolve(process.cwd(), options.templatesDir || './templates')
  }
  class ReactComponentServer extends EventEmitter {
    constructor () {
      super()
      this.expressApp = expressApp // expose this
    }
    // we should working with gets 99% of the time
    get (path, ...args) {
      expressApp.get(path, this.handleRoute(...args))
    }
    renderComponent (options, res) {
      this.isValidSetup(options, (err, requires) => {
        if (err) {
          return this.onError(err, res)
        }
        const Component = requires.component
        const template = requires.template
        const {props, meta} = options
        const _template = template(ReactDOMServer.renderToString(<Component {...props} />), {props, meta})
        const html = ReactDOMServer.renderToStaticMarkup(_template)
        res.send(`${doctype}${html}`)
      })
    }
    isValidSetup (_options, callback) {
      // this can be alot stricter
      const options = Object.assign({}, _options, defaults)
      const resolvedPaths = {}
      const promises = ['component', 'template'].map((key) => {
        const _path = path.resolve(dirs[key], options[key])
        resolvedPaths[key] = _path
        return this.isValidRequire(_path)
      })
      Promise.all(promises)
        .then(() => {
          callback(null, {
            component: require(resolvedPaths.component),
            template: require(resolvedPaths.template)
          })
        }, (err) => {
          callback(err)
        })
    }
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
    isValidRequire (_path) {
      return new Promise((resolve, reject) => {
        fs.stat(_path, (err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })
    }
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
    listen (port, callback) {
      if (expressApp.address().port) return
      expressApp.listen(port, callback)
    }
  }

  return new ReactComponentServer()
}

export {create, safeStringify}
