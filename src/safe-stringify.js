/**
 * safeStringify - json stringifys an object and will avoid scripts being able to execute inside json
 *
 * @param {object} obj - object to stringify
 * @returns {string} stringifiedObj - the stringified object
 */
function safeStringify (obj) {
  let json
  try {
    json = JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--')
  } catch (e) {
    json = { error: e.message }
  }
  return json
}

export {safeStringify}
