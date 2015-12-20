
const React = require('react')

const App = React.createClass({
  render: function () {
    return React.createElement('div', {className: 'app-container'},
      React.createElement('span', null, 'Foo Bar')
    )
  }
})

module.exports = App
