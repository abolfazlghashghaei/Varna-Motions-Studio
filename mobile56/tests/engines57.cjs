const assert = require("node:assert/strict"),
  C = require("../../Varna_Motion_Studio/js/editor51-core.js"),
  Caption = require("../web/engines/captions57.js"),
  Project = require("../web/engines/project57.js"),
  Timeline = require("../web/engines/timeline57.js");
let c = {
  id: "caption",
  start: 1,
  end: 4,
  text: "سلام world ۱۴۰۵",
  style: { color: "#ffffff" },
};
Caption.distribute(c);
Caption.validate(c);
assert.equal(c.words.length, 3);
c.caption57.mode = "karaoke";
let rendered = Caption.renderRows([c], 2.5)[0];
assert.equal(rendered.words[1].style.color, "#d8ff73");
assert.equal(rendered.words[0].style.color, "#ffffff");
assert.equal(c.words[1].style.color, undefined);
Caption.setWord(c, 1, 2.1, 2.9);
assert.throws(() => Caption.setWord(c, 1, 1.9, 3.1));
Caption.retime(c, 2, 8);
assert.equal(c.words[1].start, 4.2);
Caption.setText(c, "درود world ۱۴۰۵");
assert.equal(c.words[1].start, 4.2);
assert.equal(c.words[0].text, "درود");
const right = Caption.split(c, 5, "right");
Caption.validate(c);
Caption.validate(right);
assert.equal(right.words[0].start, 5);
assert.equal(c.words.at(-1).end, 5);
let doc = C.fresh();
doc.layers52 = [];
doc.captions = [c, right];
const packed = Project.pack(doc);
assert.equal(packed.timebase.denominator, 720000);
assert.equal(packed.captions[0].startTicks, 1440000);
assert.deepEqual(Project.unpack(packed, C.validate), doc);
let round = doc;
for (let i = 0; i < 1000; i++)
  round = Project.unpack(Project.pack(round), C.validate);
assert.deepEqual(round, doc);
assert.throws(() => Project.unpack({ ...packed, version: 99 }, C.validate));
const bad = structuredClone(packed);
bad.captions[0].startTicks = 0.5;
assert.throws(() => Project.unpack(bad, C.validate));
const store = {
  data: new Map(),
  getItem(k) {
    return this.data.get(k) || null;
  },
  setItem(k, v) {
    this.data.set(k, v);
  },
};
Project.save(store, doc, C.validate);
doc.name = "second";
Project.save(store, doc, C.validate);
store.setItem("mobile57-project", "corrupt");
assert.equal(Project.recover(store, C.validate).source, "mobile57-backup");
Project.save(store, doc, C.validate);
assert.equal(Project.recover(store, C.validate).project.name, "second");
const parsed = Caption.parse(
  "WEBVTT\n\n00:00:00.500 --> 00:00:01.900\nسلام world\n\n00:00:02.000 --> 00:00:03.200\nNext line",
  C.id,
);
assert.equal(parsed[0].start, 0.5);
assert.equal(parsed[0].text, "سلام world");
assert.equal(Caption.parse(Caption.vtt(parsed), C.id)[1].end, 3.2);
assert.throws(() =>
  Caption.parse("1\n00:00:03,000 --> 00:00:02,000\nbad", C.id),
);
assert.equal(Timeline.snap(doc, 5.025, null, 60, true), 5);
assert.equal(
  Timeline.snap(doc, 5.07, null, 100, false),
  Math.round(5.07 * 30) / 30,
);
console.log(
  "PASS57: caption word timing, Persian/English preservation, active word rendering data, split and retime, 1000 integer-clock round trips, schema rejection, corrupted-autosave recovery, VTT/SRT and frame/edge snapping.",
);
