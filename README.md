# MEJIRO

**M**ulti-system **E**lectronic **J**ournal with **I**ntegrated **R**olling and **O**utput

A local-first, no-backend Progressive Web App for non-D&D tabletop RPGs: a
character sheet editor, a dice-pool builder, and a roller that posts formatted
results to Discord via webhooks. Free, open source, no account, no server —
your data never leaves your browser unless you export it.

> First release ships one complete vertical slice for **Curseborne**
> (attribute + skill d10 pools, 8–9 = 1 hit / 10 = 2 hits, enhancements,
> curse dice, and the two-stage trick purchase phase), in **English and
> Korean**. The sheet doubles as the roller: tap an attribute and a skill
> to build your pool.

## Features

- **Character sheets** per system template, stored locally in IndexedDB
- **Sheet-as-roller** — tap an attribute + skill on the sheet, add curse
  dice / enhancement / difficulty in the roll bar, and roll
- **Roller** — counts hits per the system's rules (8–9 one hit, 10 two),
  shows each die (curse dice marked) and pass/fail against difficulty
- **Trick purchase phase** — spend leftover *extra hits* on your own trick
  list (name + cost, entered by you) with a live budget check
- **Sheet extras** — identity block, clickable injury track, edges & paths,
  conditions — all user-filled
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

By default the build is served from the `/MEJIRO/` sub-path (GitHub Pages —
the path is case-sensitive and must match the repo name; CI derives it
automatically). For a root deployment (Netlify/Vercel) build with `BASE_PATH=/`:

```bash
BASE_PATH=/ npm run build
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on
every push to `main`. Enable Pages for the repository (Settings → Pages →
Source: GitHub Actions) once and pushes deploy automatically.

## System templates

A system is described by a single JSON file under `src/templates/`
(`curseborne.json` is the reference). A template defines attributes, skills,
categories, dice mechanics (sides, hit threshold, optional doubles/explode/
botch/curse dice), and roll/enhancement rules — each label multilingual. The
dice engine is data-driven, so many new systems can be added as JSON without
code changes. Register a new template in `src/templates/index.ts`.

Templates carry only functional game data (stat names, dice rules). Content
with creative expression — trick lists, edges, paths, conditions — is entered
by each user on their own characters, never bundled with the app.

## Discord webhooks

In **Settings**, add one or more Discord webhook URLs (Discord → Server
Settings → Integrations → Webhooks). Roll results and purchased tricks are
posted as embeds to the active webhook, localized to your chosen Discord output
language.

## Roadmap

GM mode, additional systems (WoD, CoC), roll history, PDF import/export,
shareable data-URL sheets, a compact picture-in-picture mini-roller, and
color themes (dark / light / per-system / custom).

## License

The MEJIRO source code is released under the [MIT License](LICENSE).

The MIT license covers the code only — it does not grant any rights to the
tabletop RPG systems the templates describe. See below.

## Fan content & trademarks

MEJIRO is an **unofficial, free, non-commercial fan tool**. It is not
affiliated with, endorsed, or sponsored by any game publisher.

- **Curseborne**, **Storypath**, and related marks are the property of
  [Onyx Path Publishing](https://theonyxpath.com/). The bundled template
  describes the system's mechanics (attribute and skill names, dice
  procedures) solely so the app can interoperate with the game; it contains
  no text from any rulebook. Game mechanics themselves are not subject to
  copyright; the system name is used nominatively to identify which game a
  template models.
- Future system templates will follow each publisher's fan-content policy —
  the [Dark Pack agreement](https://www.paradoxinteractive.com/games/world-of-darkness/community/dark-pack-agreement)
  for World of Darkness and the
  [Chaosium Fan Material Policy](https://www.chaosium.com/fan-material-policy/)
  for Call of Cthulhu — including any required logos and notices.
- If you are a rights holder and have a concern about content in this
  repository, please open an issue and it will be addressed promptly.

To keep this footing, community-contributed templates must not include
rulebook text, art, or other copyrighted expression — only the functional
data needed to play (stat names, dice rules, costs).
