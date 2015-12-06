import fs from 'fs'
import path from 'path'
import TestUtils from 'react-addons-test-utils'

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
  const options = Object.assign({}, _options, defaults)
  const resolvedPaths = {}
  const promises = ['component', 'template'].map((key) => {
    const _path = path.resolve(dirs[key], options[key])
    resolvedPaths[key] = _path
    return isValidRequire(_path)
  })
  Promise.all(promises)
    .then(() => {
      callback(null, {
        component: require(resolvedPaths.component),
        componentPath: resolvedPaths.component,
        template: require(resolvedPaths.template),
        templatePath: resolvedPaths.template
      })
    }, (err) => {
      callback(err)
    })
}

/**
 * componentIsValid - just checkes to makes sure item required is a valid component
 *
 * @param {Function} component - a react component
 * @returns {Boolean} isComponent - true or false is is valid component
 */

 function componentIsValid (Component) {
   return TestUtils.isElement(Component)
 }

export {isValidRequire, isValidSetup, componentIsValid}
