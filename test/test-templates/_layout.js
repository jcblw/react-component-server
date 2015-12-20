import React from 'react'
import {safeStringify} from '../../src/safe-stringify'

const template = (ComponentString, {props, meta}) => {
  return (
    <html>
      <head>
        <title>Test Template</title>
        <meta charSet='utf8' />
      </head>
      <body>
        <div id='app' dangerouslySetInnerHTML={{
          __html: ComponentString
        }} />
        <script src={meta.bundlePath} />
        <script dangerouslySetInnerHTML={{
          __html: `
            var React = require('react')
            var ReactDOM = require('react-dom')
            var App = require('${meta.bundleExpose}')
            ReactDOM.render(
              React.createElement(App, ${safeStringify(props)}),
              document.getElementById('app')
            );
          `
        }} />
      </body>
    </html>
  )
}

module.exports = template
