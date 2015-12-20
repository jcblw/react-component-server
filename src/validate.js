import fs from 'fs'
import path from 'path'

/**
 * isValidRequire - a method that will check to see if path is currently there before requiring
 *
 * @param {string} _path - a path to check stat
 * @returns {Promise} promise - a new promise object that resolves if valid
 */
function isValidRequire (_path) {
  return new Promise((resolve, reject) => {
    fs.stat(_path, (err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

/**
 * isValidSetup - checks to see if options passes are valid
 *
 * @param {Object} _options - the same options object passed to create
 * @param {Object} config - some config for defaults and directory locations
 * @param {object} config.defaults - the default object to extend
 * @param {object} config.dirs - the dirs to the components and templates
 * @param {string} config.dirs.component - the path to components
 * @param {string} config.dirs.templates - the path to the templates
 * @param  {function} callback - a function to be called once validation is done passes node style (err, results)
 */
function isValidSetup (_options, {dirs, defaults}, callback) {
  // this can be alot stricter
  const options = Object.assign({}, defaults, _options)
  const resolvedPaths = {}
  const promises = ['component', 'template'].map((key) => {
    const _path = path.resolve(dirs[key] || '', options[key] || '')
    resolvedPaths[key] = _path
    return isValidRequire(_path)
  })
  Promise.all(promises)
    .then(() => {
      const component = require(resolvedPaths.component)
      const template = require(resolvedPaths.template)
      if (!isComponentValid(component)) {
        return callback(new TypeError(`${resolvedPaths.component} is not a valid React component`))
      }
      if (!isTemplateValid(template)) {
        return callback(new TypeError(`${resolvedPaths.template} is not a valid template`))
      }
      callback(null, {
        component,
        componentPath: resolvedPaths.component,
        template,
        templatePath: resolvedPaths.template
      })
    })
    .catch((err) => {
      callback(err)
    })
}

/**
 * componentIsValid - just checkes to makes sure item required is a valid component
 *
 * @param {Function} component - a react component
 * @returns {Boolean} isComponent - true or false is is valid component
 */

function isComponentValid (Component) {
  return typeof Component === 'function' // this can get more detailed
}

/**
 * isTemplateValid is a function to test to see if the required template is valid
 *
 * @param {Function} template - a valid or invalid template function
 * @returns {Boolean} isValidTemplate - true if the template is valid false if it is not.
 */

function isTemplateValid (template) {
  return typeof template === 'function'
}

export {isValidRequire, isValidSetup, isComponentValid, isTemplateValid}
