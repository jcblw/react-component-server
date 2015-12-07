# React Component Server

[![Build Status](https://travis-ci.org/jcblw/react-component-server.svg?branch=master)](https://travis-ci.org/jcblw/react-component-server)

A small lib that wraps express to allow for simple serving of react components.

## Usage

### Creating Server

To create a new React Component Server call the create method

```javascript
const ReactComponentServer = require('react-component-server')
const componentServer = ReactComponentServer.create({
  // ... options
})
```

#### Component Server Options

```javascript
{
  // pass an express server instead of creating a new one
  server: server,
  // relative path to components dir
  componentsDir: './components',
  // relative path to templates dir  
  templatesDir: './templates',
  // set of defaults to use
  defaults: {
    // flag to create a browserify bundle of component
    bundle: true
    // default component
    component: './App.js', // ./components/App.js
    // default props to pass to component
    props: {},
    // the template for the component
    template: './template.js' // ./templates/template.js
  }
}
```

### Creating routes

```javascript
componentServer.get('/', function(res, req, done) {
  const query = req.query || {}
  // pass options to done same as defaults
  done({
    component: './Explore.js',
    props: {query},
    template: './explore-template.js'
  })
})
// or you can just pass an Object
componentServer.get('/about', {component: './About.js'})
// or just use defaults
componentServer.get('/foo')
```

### Listening on Port

```javascript
// pretty much a proxy for express's listen method
componentServer.listen(3000)
// or you could just listen with the passed express app
```

### Browserify bundles

To allow your component to be ran both client and server side you can create a bundle for it. There is a bit more configuration but is worth it.

#### Specify route needs bundle

```javascript
componentServer.get('/bar', {
  bundle: true,
  template: './layout-bundle.js',
  component: './Bar.js'
})
```

next you will need to inject that bundle and start it in the layout. Here is a example of what a simple layout that includes a bundle would look like.

```javascript
const React = require('react')
const {safeStringify} = require('react-component-server') // util to strip <scripts>
const template = (ComponentString, {props, meta}) => {
  return (
    <html>
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
```

### What this project needs help with

- external cacheing of html, and bundles
- remove dependency on express
- catching more error states
- more test
- feedback!
