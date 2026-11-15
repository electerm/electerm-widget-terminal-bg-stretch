# Stretch Terminal Background

English | [中文](README_CN.md)

Stretch the terminal background image to 100% instead of the default cover mode.

One of the CSS patches from the electerm wiki page
[Custom CSS examples](https://github.com/electerm/electerm/wiki/Custom-CSS-examples),
packaged as a widget: install it, press **Start widget**, and the patch is on the
window — and on every launch after that.

| | |
| --- | --- |
| Shape | instance widget, one switch |
| Needs | electerm **v5.12.0** or newer |
| Applies | `style.css`, applied by electerm itself |
| Unit tests | `npm test` — no dependencies, no install |

## Install

**Settings → Widgets → Import**, then paste:

```text
electerm/electerm-widget-terminal-bg-stretch
```

Or **Import folder** against a local clone.

## Use

**Settings → Widgets → Stretch Terminal Background** → **Start widget**. Leave *Apply on launch* on
and it is re-applied at every start; **Stop** in *Running instances* takes it off
again.

## What it changes

Overrides `background-size` on the terminal background layer to `100% 100%`.

`style.css`, in full:

```css
#container .session-batch-active .xterm-screen::before{background-size: 100% 100% !important;}
```

## How it works

This is a manifest-only widget: `package.json` + `style.css`, no JavaScript.

```json
"styles": ["style.css"]
```

electerm reads that list, applies the css to its own window for as long as the
widget runs, and takes it off again on **Stop**.

Nothing of the widget runs in the app's process, which is the point: the same
widget works in the desktop app and in
[electerm-web](https://github.com/electerm/electerm-web). A browser build has no
`webContents.insertCSS()` to call — that is why the previous version of this
widget (a `main.js` of ~180 lines of Electron code, one copy per patch) only
ever worked on the desktop.

- The stylesheet becomes one `<style data-electerm-widget="terminal-bg-stretch">` tag, rewritten
  in place, so applying again never stacks tags.
- A window that loads while the widget runs rebuilds it from the host's registry;
  the auto-run list applies it again on every launch.
- Widgets that need to change their css at runtime use
  `require('@electerm/widget-api').css.apply(css)`. `require('electron')` is
  refused, so a widget cannot end up desktop-only by accident.

## Notes

- **Standalone, not the built-in setting.** electerm also has **Settings → Common
  → Custom CSS**, applied by the app into `<style id="custom-css">` and synced
  across devices. This widget does not read or write it. Both can be active; the
  setting's sheet is last in the document, so a rule in both places is won by the
  setting. Keep a rule in one place.
- **It applies to the whole window**, settings panel included — a rule that hides
  the panel you would use to undo it hides itself. Recovery: quit electerm and
  delete `<data dir>/widgets/terminal-bg-stretch/`; the auto-run entry then has nothing to
  start.

## License

MIT
