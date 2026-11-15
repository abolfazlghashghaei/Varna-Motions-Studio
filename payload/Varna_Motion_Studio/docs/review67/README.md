# Workbench67 visual review

Real Chromium screenshots using generic manual captions and browser font fallbacks. These show the HTML panel, not native Adobe output. The Windows/CEP application and vendor effects have not been visually certified.

- [Font inspector, 1000×760](font.png)
- [Motion library, 1000×760](motion.png)
- [Persistent table preview, 760×520](table-compact.png)
- [Existing font browser in a compact dialog](font-dialog.png)

Reproduce with:

```sh
NODE_PATH=tooling53/node_modules node Varna_Motion_Studio/tests/ui67_review.cjs
```

Set `VARNA_SCREENSHOT_DIR` to choose a directory. The test captures all five reference workspaces at both dimensions and the font dialog. A complete route/control-access test is in `tests/workspace67_browser.cjs`; table fit is checked independently by `tests/table66_pages_browser.cjs`.

See [WORKBENCH67.md](../WORKBENCH67.md) and [TODO_WORKBENCH67.md](../TODO_WORKBENCH67.md) for implementation scope and remaining work.
