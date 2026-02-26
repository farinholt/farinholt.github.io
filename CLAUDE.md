# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal academic website for Brown Farinholt, built with Jekyll using the [al-folio](https://github.com/alshedivat/al-folio) theme. Hosted on GitHub Pages at brownfarinholt.com.

## Build Commands

```bash
bundle install          # Install Ruby dependencies
bundle exec jekyll serve  # Local dev server (http://localhost:4000)
JEKYLL_ENV=production bundle exec jekyll build  # Production build (outputs to _site/)
```

## Deployment

Travis CI builds the `release` branch and deploys the built `_site/` to the `master` branch via GitHub Pages. Do not push directly to `master`; commit to `release` instead.

## Architecture

- **`_config.yml`**: Central configuration — site metadata, social links, Jekyll plugins, Jekyll-Scholar settings, and collection definitions
- **`_pages/`**: Main content pages. `about.md` serves as the site index (`permalink: /`). Uses YAML front matter for layout, profile image, and social toggle
- **`_layouts/`**: Template hierarchy: `default.html` → `page.html` → `about.html`. Default wraps all pages with head/header/footer includes
- **`_includes/`**: Reusable HTML partials (header, footer, social icons, news, pagination)
- **`_sass/`**: SCSS stylesheets. Theme color and all design variables are in `_variables.scss` (`$theme-color` on line 73)
- **`_plugins/jekyll_get.rb`**: Custom plugin that fetches JSON data at build time (pulls GitHub repos from the API into `site.data.github`)
- **`assets/`**: Static files — CSS, JS, fonts, images, PDFs, and PGP keys

## Key Conventions

- Publications are auto-generated from BibTeX via jekyll-scholar. Source bibliography goes in `_bibliography/papers.bib`, rendered using the `bib` template
- The `education` collection is defined in `_config.yml` and its pages live in `_pages/education.md`
- KaTeX is enabled for math rendering; Pygments handles code syntax highlighting
- `_pages/about.md` is the homepage — do not create a separate `index.html` in the root directory
