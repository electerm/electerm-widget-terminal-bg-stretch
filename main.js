/**
 * Stretch Terminal Background — Stretch the terminal background image to 100% instead of the default cover mode.
 *
 * The stylesheet is ./style.css, copied verbatim from the wiki page
 * "Custom CSS examples". It is applied to electerm's own window from the main
 * process: a widget's UI is a sandboxed iframe and cannot touch the app's DOM,
 * but a widget's main.js runs in the main process, where
 * `webContents.insertCSS()` styles a page from the outside.
 *
 * Instance widget on purpose: electerm's auto-run list starts an instance on
 * every launch, which is what makes the patch stay applied. The other half is
 * the reload handler — an inserted stylesheet lives in the current document, so
 * every `did-finish-load` re-inserts it.
 *
 * Standalone by design: it does not read or write the built-in `customCss`
 * setting (Settings -> Common). Both can be active; the setting's sheet is last
 * in the document, so it wins a tie. Keep a rule in one place.
 */

const fs = require('fs')
const path = require('path')
const { app, webContents } = require('electron')

const RELOAD = 'did-finish-load'
const NOOP = () => {}
const STYLE_FILE = path.join(__dirname, 'style.css')

// devtools and the widget's own iframe are `window`-ish webContents too; the
// app renderer is served over http://127.0.0.1:<port>, so filtering on the
// scheme is what keeps this from styling the wrong document
const SKIP_SCHEME = /^(devtools|electerm-widget|chrome|chrome-extension|about|data):/i

// one stylesheet for the whole app: instances share this module, and
// singleInstance in package.json keeps a second start from fighting over it
let currentCss = ''
const applied = new Map() // webContents.id -> { wc, onLoad, key, queue }
let onCreated = null

function isAppWindow (wc) {
  if (!wc || wc.isDestroyed() || wc.getType() !== 'window') {
    return false
  }
  return !SKIP_SCHEME.test(wc.getURL() || '')
}

function appWindows () {
  return webContents.getAllWebContents().filter(isAppWindow)
}

// One insert at a time, per window. Two overlapping insertCSS calls both see
// `key === null`, both insert, and only one key is kept — the other stylesheet
// is unremovable, so Stop would leave the CSS applied. Measured on the parent
// widget this code came from.
function insert (wc) {
  const entry = applied.get(wc.id)
  if (!entry) {
    return Promise.resolve()
  }
  entry.queue = entry.queue.then(() => applyOnce(entry)).catch(NOOP)
  return entry.queue
}

async function applyOnce (entry) {
  const { wc } = entry
  if (wc.isDestroyed()) {
    return
  }
  if (entry.key) {
    const key = entry.key
    entry.key = null
    await wc.removeInsertedCSS(key).catch(NOOP)
  }
  if (!currentCss) {
    return
  }
  try {
    entry.key = await wc.insertCSS(currentCss)
  } catch (e) {
    // a window still on about:blank has no document to style yet; the
    // did-finish-load handler gets another chance
  }
}

function attach (wc) {
  if (applied.has(wc.id)) {
    insert(wc)
    return
  }
  const onLoad = () => insert(wc)
  const entry = { wc, onLoad, key: null, queue: Promise.resolve() }
  applied.set(wc.id, entry)
  wc.on(RELOAD, onLoad)
  wc.once('destroyed', () => {
    applied.delete(wc.id)
  })
  insert(wc)
}

async function detachAll () {
  const entries = [...applied.values()]
  applied.clear()
  // before draining: a queued insert must not put a stylesheet back after this
  currentCss = ''
  await Promise.all(entries.map(async entry => {
    try {
      entry.wc.removeListener(RELOAD, entry.onLoad)
    } catch (e) {}
    await entry.queue.catch(NOOP)
    if (!entry.key) {
      return
    }
    const key = entry.key
    entry.key = null
    if (!entry.wc.isDestroyed()) {
      await entry.wc.removeInsertedCSS(key).catch(NOOP)
    }
  }))
}

function sizeLabel (bytes) {
  return bytes > 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`
}

function widgetRun (instanceConfig = {}, ctx = {}) {
  const { log = NOOP } = ctx
  const instanceId = `terminal-bg-stretch-${Date.now()}`
  let started = false

  function readCss () {
    try {
      return fs.readFileSync(STYLE_FILE, 'utf8').trim()
    } catch (e) {
      throw new Error(`cannot read style.css: ${e.message}`)
    }
  }

  function refresh () {
    currentCss = readCss()
    appWindows().forEach(attach)
    return currentCss
  }

  return {
    instanceId,

    async start () {
      if (started) {
        throw new Error('This patch is already applied')
      }
      const css = refresh()
      if (!css) {
        throw new Error('style.css is empty')
      }
      started = true
      onCreated = (event, wc) => {
        if (isAppWindow(wc)) {
          attach(wc)
        }
      }
      app.on('web-contents-created', onCreated)
      // let the queued inserts land before reporting, so the message and a stop
      // issued right after this both describe the same state
      await Promise.all([...applied.values()].map(entry => entry.queue.catch(NOOP)))

      const windows = applied.size
      const bytes = Buffer.byteLength(css, 'utf8')
      log('info', `applied ${sizeLabel(bytes)} to ${windows} window(s)`)
      return {
        msg: `Stretch Terminal Background applied (${sizeLabel(bytes)} to ${windows} window(s))`
      }
    },

    async stop () {
      if (onCreated) {
        app.removeListener('web-contents-created', onCreated)
        onCreated = null
      }
      await detachAll()
      started = false
      log('info', 'patch removed')
    }
  }
}

module.exports = { widgetRun }
