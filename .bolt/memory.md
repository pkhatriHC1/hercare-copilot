# Project memory

## Product intent & audience

- App with a collapsible side navigation and a primary content area; likely dashboard/admin-style given table usage.

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Layout uses a design-system `AppShell` component pattern with `AppShell.Main` as the content wrapper.
- Side navigation is collapsible; content area is expected to responsively use the freed horizontal space.
- Page content includes tables with existing overflow handling; keep overflow/scroll behavior intact.
- Preserve existing page padding when adjusting content width.

## Decisions, constraints & rationale

- `AppShell.Main` previously imposed a max-width inner wrapper that prevented content from using space released by nav collapse; removed that cap.
- Rationale: avoid wasted whitespace after collapse; keep layout fluid without changing padding or scroll behavior.
- Verification approach: run production build (`vite build`) after layout edits.

## Open questions & assumptions

- Assumes `AppShell` is the primary layout shell across pages.
- No explicit responsive breakpoints discussed yet; collapsed-width behavior is driven by the shell rather than custom media queries.