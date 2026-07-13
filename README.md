# MEJIRO

**M**ulti-system **E**lectronic **J**ournal with **I**ntegrated **R**olling and **O**utput

A local-first, no-backend Progressive Web App for non-D&D tabletop RPGs: a
character sheet editor, a dice-pool builder, and a roller that posts formatted
results to Discord via webhooks. Free, open source, no account, no server —
your data never leaves your browser unless you export it.

> First release ships one complete vertical slice for **Storypath Ultra**
> (attribute + skill d10 pools, enhancements, threshold successes, and the
> two-stage trick/stunt purchase phase), in **English and Korean**.

## Features

- **Character sheets** per system template, stored locally in IndexedDB
- **Dice-pool builder** — pick an attribute + skill, add enhancement, set
  difficulty, and see the live pool total
- **Roller** — rolls the pool, counts successes per the system's rules, shows
  each die and pass/fail against difficulty
- **Trick / stunt purchase phase** — spend leftover *threshold successes* on
  system-defined tricks with a live budget check
- **Discord output** — post localized roll results and purchased tricks to a
  webhook (two stages)
- **Resource tracker** — quick +/- controls with a change log and undo
- **Localization** — full EN/KO UI, multilingual template labels, and a
  separately configurable Discord output language
- **Import / export** — portable JSON per character
- **Installable PWA** — works offline once loaded

## Tech stack

React + TypeScript + Vite, `vite-plugin-pwa`, Zustand (state), `idb`
(IndexedDB), and `react-i18next`. No backend of any kind.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run the engine unit tests (Vitest)
npm run build    # type-check + production build (emits PWA assets)
npm run preview  # preview the production build
```

By default the build is served from the `/mejiro/` sub-path (GitHub Pages).
For a root deployment (Netlify/Vercel) build with `BASE_PATH=/`:

```bash
BASE_PATH=/ npm run build
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on
every push to `main`. Enable Pages for the repository (Settings → Pages →
Source: GitHub Actions) once and pushes deploy automatically.

## System templates

A system is described by a single JSON file under `src/templates/`
(`storypath-ultra.json` is the reference). A template defines attributes,
skills, categories, dice mechanics (sides, success threshold, optional
doubles/explode/botch), roll/enhancement rules, a trick catalogue, and tracked
resources — each label multilingual. The dice engine is data-driven, so many
new systems can be added as JSON without code changes. Register a new template
in `src/templates/index.ts`.

## Discord webhooks

In **Settings**, add one or more Discord webhook URLs (Discord → Server
Settings → Integrations → Webhooks). Roll results and purchased tricks are
posted as embeds to the active webhook, localized to your chosen Discord output
language.

## Roadmap

GM mode, additional systems (WoD, CoC), roll history, PDF import/export,
shareable data-URL sheets, and a compact picture-in-picture mini-roller.
