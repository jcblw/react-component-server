# React Component Server

https://travis-ci.org/jcblw/react-component-server.svg?branch=master

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
```

### Listening on Port

```javascript
// pretty much a proxy for express's listen method
componentServer.listen(3000)
// or you could just listen with the passed express app
```
