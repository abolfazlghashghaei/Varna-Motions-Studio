# Ownership and reasons for pilot-b69.css

This is an AE-only transitional stylesheet, not phase D consolidation. It is loaded before `stage-a68.css`; important layer order is intentional. No legacy file has been deleted, emptied, renamed or reordered.

| Group | Existing conflict | New ownership and boundary |
|---|---|---|
| Root tokens | Absolute legacy font/control sizes | Root follows the existing size setting; rem scales have explicit 12px / 32px floors. Project graphics stay in composition pixels. |
| Shell | Fixed grid rows and right/top rails in studio44/workflow-ui/production47 | Four fluid rows on the two active pilot pages: header, vertically scrolling workspace, action, bottom page nav. |
| Routing | Production steps + section tabs + section dropdown + leaves | The old nodes remain for callers, but are hidden; pager/filter guards expose the original controls together. |
| Disclosures | Closed word details and open table summaries were forcibly hidden | Native details/summary is operable. A final scoped hidden rule protects logic-controlled conditional fields. |
| Cards/forms | Fixed minimum column widths, color editor columns and numeric wrapper heights | Flexible rows and zero-minimum columns. All control kinds retain their events and values. No duplicate input tree. |
| Word choices | workspace67 max-height:100px + old overflow rules | Full wrapped rows take their natural height; sibling controls cannot overlap choices. |
| Switch | Shrinking track with fixed-position thumb | Track cannot shrink below its thumb; label is the actual >=32px pointer target. |
| Numeric | Fixed 31px wrapper and narrow handle | Original value, slider and handle wrap as needed; original Numeric37 controller is unchanged. |
| Preview | Unconditional open, 180px scene height, width/height mismatch | Collapsible; compact starts closed; limited geometry preserves the actual aspect ratio. Authored pieces are excluded from UI target/font overrides. |
| Dense cells | Mandatory 360px minimum grid | Original cells become a labelled vertical list when necessary; relative row/column inputs preserve resizing access. |
| Footer | `.wide` margin and old fixed footer | The original main button is reparented into a non-scrolling grid row. Old margin is reset, preventing wasted space at high zoom. |
| Selected values | Native select single-line value clips long labels | A non-interactive wrapped value is painted over the same native select; ID, picker, keyboard and handlers are preserved. Text geometry is still tested; native select + its painted value are one compound control. |
| Direction | Latin technical labels embedded in RTL text | UI copy is simplified; bdi/dir and isolate protect values. User text, font names, IDs and host names are not translated. |
| Compatibility | CEP 12 has Chromium 99, without container queries | Identical ResizeObserver bands are present. A browser test deletes container-query rules and tests the fallback separately. |

New important declarations are grouped and explained inline because the old sheets and stage A bridge already use important declarations. New normal rules remain normal where no override conflict exists. Phase D must prove ownership over all 22 pages and both themes before merging/removing these bridges.
