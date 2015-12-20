'use strict'

// monkey patch babel
import 'babel-core/register'

import test from 'ava'
import {isValidRequire} from '../src/validate'

test('the isValidRequire method should return a promise', t => {
  const foo = isValidRequire('')
  t.is(typeof foo.then, 'function')
  foo.then(() => {}, (err) => {
    t.is(typeof err, 'object')
    t.pass()
  })
})
