# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal academic website for Brown Farinholt. Plain static HTML/CSS hosted on GitHub Pages at brownfarinholt.com. No build step — what you see in the repo is what gets served.

## Architecture

- **`index.html`**: Single-page site with all content — navigation, about section, education section, social links, and footer. Sections are anchored (`#about`, `#education`)
- **`style.css`**: All styles in one plain CSS file. Theme color is `#B509AC` (purple). Responsive breakpoints at 32em, 48em, and 64em; hamburger menu triggers at 600px
- **`assets/`**: Static files — icon font CSS (`css/`), web fonts (`webfonts/`, `fonts/`), favicons (`favicons/`), images (`img/`), PDFs (`pdf/`), and PGP keys (`keys/`)
- **`CNAME`**: Custom domain configuration (brownfarinholt.com)

## Deployment

GitHub Pages serves the `master` branch directly. No build process or CI pipeline.

## Key Conventions

- External publications link to Google Scholar rather than a local bibliography
- Icon fonts: Font Awesome (via `fontawesome-all.min.css`) for general icons, Academicons (via `academicons.min.css`) for academic service icons (Google Scholar, ORCID)
