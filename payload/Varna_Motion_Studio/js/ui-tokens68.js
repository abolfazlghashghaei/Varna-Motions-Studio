/* UI-only contrast adapter. Project data, native payloads and saved palette inputs are untouched. */
(function (w) {
  'use strict';
  if (!document.documentElement.hasAttribute('data-ui-a68')) return;
  const body = document.body;
  const rootStyle = getComputedStyle(document.documentElement);
  const darkInk = parse(rootStyle.getPropertyValue('--ui-ink-dark'), [0, 0, 0]);
  const lightInk = parse(rootStyle.getPropertyValue('--ui-ink-light'), [255, 255, 255]);
  const clamp = value => Math.max(0, Math.min(255, value));
  function parse(value, fallback) {
    const text = String(value || '').trim();
    if (/^#[\da-f]{6}$/i.test(text)) return [1, 3, 5].map(i => parseInt(text.slice(i, i + 2), 16));
    if (/^#[\da-f]{3}$/i.test(text)) return [1, 2, 3].map(i => parseInt(text[i] + text[i], 16));
    if (/^rgba?\(/i.test(text)) {
      const channels = text.match(/[\d.]+/g)?.map(Number);
      if (channels?.length >= 3 && channels.slice(0, 3).every(Number.isFinite)) return channels.slice(0, 3).map(clamp);
    }
    return fallback.slice();
  }
  function luminance(color) {
    return color.map(value => {
      value /= 255;
      return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4);
    }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
  }
  function ratio(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  const worst = (color, backgrounds) => Math.min(...backgrounds.map(bg => ratio(color, bg)));
  const bestInk = backgrounds => [darkInk, lightInk, [0, 0, 0], [255, 255, 255]].reduce((best, ink) => worst(ink, backgrounds) > worst(best, backgrounds) ? ink : best, darkInk);
  function readable(preferred, backgrounds, minimum) {
    if (worst(preferred, backgrounds) >= minimum) return preferred;
    const ink = bestInk(backgrounds);
    for (let step = 1; step <= 100; step++) {
      const color = preferred.map((channel, i) => Math.round(channel + (ink[i] - channel) * step / 100));
      if (worst(color, backgrounds) >= minimum) return color;
    }
    return ink.slice();
  }
  const css = color => 'rgb(' + color.map(Math.round).join(', ') + ')';
  function refresh() {
    const style = getComputedStyle(body);
    const read = (name, fallback) => parse(style.getPropertyValue(name), fallback);
    const surface = read('--u-panel', darkInk);
    let field = read('--u-input', surface);
    // A single foreground must be readable on both surfaces. Keep custom hues,
    // but avoid an input tone so different that neither foreground can pass AA.
    if (worst(bestInk([surface, field]), [surface, field]) < 4.5) field = surface.slice();
    const light = luminance(surface) > .35;
    const text = readable(read('--u-text', light ? darkInk : lightInk), [surface, field], 4.5);
    const muted = readable(read('--u-muted', text), [surface, field], 4.5);
    const action = read('--u-accent', light ? darkInk : lightInk);
    const onAction = readable(ratio(darkInk, action) > ratio(lightInk, action) ? darkInk : lightInk, [action], 4.5);
    const soft = action.map((channel, i) => Math.round(channel * .12 + surface[i] * .88));
    const accent = readable(action, [surface, field, soft], 4.5);
    const border = surface.map((channel, i) => Math.round(channel * .65 + muted[i] * .35));
    const seed = role => read('--ui-seed-' + role + (light ? '-light' : '-dark'), light ? darkInk : lightInk);
    const values = {
      '--ui-color-surface': surface,
      '--ui-color-field': field,
      '--ui-color-text': text,
      '--ui-color-muted': muted,
      '--ui-color-action': action,
      '--ui-color-on-action': onAction,
      '--ui-color-accent': accent,
      '--ui-color-soft': soft,
      '--ui-color-border': readable(border, [surface, field], 3),
      '--ui-color-focus': readable(action, [surface, field], 3),
      '--ui-color-success': readable(seed('success'), [surface, field], 4.5),
      '--ui-color-warning': readable(seed('warning'), [surface, field], 4.5),
      '--ui-color-danger': readable(seed('danger'), [surface, field], 4.5)
    };
    for (const [name, value] of Object.entries(values)) body.style.setProperty(name, css(value));
    body.dataset.uiColorScheme68 = light ? 'light' : 'dark';
  }
  document.addEventListener('varna:palette50', refresh);
  new MutationObserver(refresh).observe(body, {attributes: true, attributeFilter: ['data-theme']});
  refresh();
  w.VarnaUITokens68 = {refresh};
})(window);
