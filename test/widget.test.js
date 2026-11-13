/**
 * The manifest and the stylesheet, checked without an Electron runtime.
 *
 * Run: node --test test/*.test.js
 */

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8')

test('the id is what the widget folder is called', () => {
  assert.strictEqual(pkg.electerm.id, 'terminal-bg-stretch')
  assert.strictEqual(pkg.name, pkg.electerm.id)
  assert.match(pkg.electerm.id, /^[a-z0-9-]+$/)
})

test('it is an auto-runnable instance widget with one switch', () => {
  assert.strictEqual(pkg.electerm.type, 'instance')
  assert.strictEqual(pkg.electerm.singleInstance, true)
  assert.deepStrictEqual(pkg.electerm.configs.map(c => c.name), ['autoRun'])
  assert.strictEqual(pkg.electerm.configs[0].default, true)
})

test('the stylesheet is the wiki text, not a paraphrase', () => {
  assert.strictEqual(css.trim(), "#container .session-batch-active .xterm-screen::before{background-size: 100% 100% !important;}")
})
