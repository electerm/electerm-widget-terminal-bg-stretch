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
| Needs | electerm **v5.8.0** or newer |
| Applies | `style.css`, copied verbatim from the wiki |
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

A widget's own UI is a sandboxed iframe on its own origin, so it cannot touch the
app's DOM. A widget's `main.js` runs in the **main process** with full Node
privileges, and there `webContents.insertCSS()` styles a page from the outside.
That is the whole mechanism — no app setting, no patched build, no injected
script.

- Every renderer reload re-inserts the stylesheet: an inserted sheet lives in the
  current document and a reload drops it (measured), so `did-finish-load` puts it
  back.
- Windows opened later are covered too (`app.on('web-contents-created')`).
- **Stop removes it properly**: each insert's key is kept per window, and inserts
  for one window are queued — two overlapping `insertCSS` calls would leave a
  stylesheet with a key nobody kept, and that one survives Stop.

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
