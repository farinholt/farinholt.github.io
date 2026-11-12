# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project and user direction

Brown Farinholt's personal homepage. His title is **Detection & response engineer at Meta**. The site should look like a conventional SIEM search application in a dark, centered application window; its event data introduces him and links to LinkedIn, Google Scholar, GitHub, email, and his PGP key.

The browser title must be exactly **Brown Farinholt**. The application name is **farinholt** (lowercase).

The user explicitly rejected marketing headlines, slogans, clever-sounding copy, and explanations of the visual joke. **Do not add taglines, a portfolio hero, visitor jokes, coffee gimmicks, or text announcing that the page is a toy or costume.** The playfulness comes solely from finding personal information inside an otherwise ordinary SIEM interface. Use literal, conventional interface labels.

Do not duplicate the CV or research bibliography. LinkedIn and Google Scholar carry that detail.

The user explicitly requested lively synthetic background activity and larger field volumes even though only the six profile/reference events are displayed. Populate the timeline and aggregates accordingly; preserve the conventional UI and restrained copy.

## Architecture

- **`index.html`**: Application header, search controls, timeline, fields sidebar, event table, and inline record details. Six public profile/reference records are embedded as JSON and represented in static HTML. Keep those two representations consistent.
- **`style.css`**: A dark application workspace bounded to 1280px, with outer breathing room, compact tables, and restrained green search controls and charts. The page scrolls naturally; do not impose nested vertical scrolling or a full-screen shell. Responsive breakpoints at 1600px, 1024px, and 600px. Native controls use dark color-scheme.
- **`site.js`**: Local field/keyword queries, filtering, synthetic background volumes, timeline counts, field values, sorting, record expansion, JSON inspection, and JSON export. Timestamps mark this document's loading, not real security activity.
- **`assets/`**: Existing favicons, public key, PDFs, and legacy font assets. Keep PDFs and keys available even if not all are linked.
- **`CNAME`**: brownfarinholt.com.

Plain HTML/CSS and dependency-free JavaScript. No build step, external runtime packages, font downloads, analytics, network queries, or persistent visitor state.

## Saved directions

- `design/siem` preserves the original light SIEM at `301fe61`.
- `design/detection-flow` preserves the abstract animation at `18bf390`; that work is tabled.
- `design/siem-dark` contains the dark, bounded SIEM design requested for deployment.

## Deployment

GitHub Pages serves the `release` branch directly. No build process or CI pipeline.

## Implementation conventions

- Ground personal facts in user-supplied information. Preserve the exact role and organization.
- Use ordinary SIEM layout and behavior: data views, a search bar, time range, field values, compact event rows, and structured/raw record views.
- Timeline, field volumes, result totals, and statistics use one deterministic synthetic activity model and respond together to the active filters and time range. They may exceed the displayed record count, as explicitly requested by the user.
- Keep the table, expanded records, and JSON exports limited to the matching profile/reference records. The toolbar reports how many records are displayed; synthetic volumes must not inflate exports or personal facts.
- Keep user query text out of HTML sinks. Do not use `eval`, dynamically execute queries, or collect visitor information.
- Keep identity and profile links available without JavaScript.
- Use accessible native controls, visible keyboard focus, and decorative inline SVG icons. Keep wide tables scrollable on narrow screens.
- Keep desktop margins and a visible outer application boundary. On mobile, retain small gutters and confine wide-table scrolling to the results area.
- Keep repository documentation consistent with material design or behavior changes.

## Verification

No configured test suite. Run `node --check site.js` and `git diff --check`. For UI changes, inspect desktop and mobile screenshots and verify query syntax/errors, dataset and field filters, empty results, row expansion, JSON views/export, sorting, synthetic totals and field volumes, keyboard access, and the no-JavaScript fallback. Verify that histogram buckets and grouped statistics sum to the displayed aggregate total, empty queries zero the aggregates, and exports contain only displayed records.
