# Elanoria

A campaign compendium for Elanor that connects world articles and portal
collections to a live D&D bestiary.

## Run locally

Use Node.js 22.12+ on the Node 22 release line, Node.js 24, or Node.js 26+.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Keep using the
same address and port to access your saved articles and portals.

## Use the compendium

- **Compendium** (`/compendium`) searches Elanor articles by name and filters
  them by category. Open any card to see its full details.
- **D&D Bestiary** (`/compendium?source=bestiary`) searches by name, filters
  by monster type and challenge rating (CR), and sorts by name, CR, hit points
  (HP), or armor class (AC). Cards show the first listed AC when a monster has
  several values. Open the stat block to see every listed AC.
- **Editor** (`/editor`) creates articles and links them to other articles or
  monsters. To change an existing article, open it and select **Edit entry**.
  The linked page lists the article under **Backlinks**.
- **Portals** (`/portals`) groups links into named campaign collections. Portals
  show the current title of each article, including after a rename.

Articles and portals are saved in the current browser. The D&D Bestiary needs
an internet connection to load the SRD data.

## Test and build

```sh
npm test
npm run test:ui
npm run lint
npm run build
```

`npm test` runs the Vitest suite once. `npm run test:ui` starts the interactive
runner. If the page does not open automatically, use the full URL printed in
that terminal. Press **Ctrl+C** in the test runner's terminal to stop it.
Run `npm run preview` after building to preview the production output locally.

The acceptance criteria are in [PRD.md](./PRD.md), and the build checklist is
in [tasks.md](./tasks.md).

## Bestiary credits

The D&D Bestiary fetches monster data from the [D&D 5e SRD API](https://www.dnd5eapi.co/).
Monster material comes from Wizards of the Coast LLC's
[System Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document),
licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/legalcode).

## Course prompt log

The original course template contains prompt-logging configuration and
`scripts/log-prompt.mjs`. Start Codex CLI inside the repository and send a short
test prompt, then check the end of `PROMPTS.md`. In PowerShell use
`Get-Content PROMPTS.md -Tail 20`. In Bash use `tail -n 20 PROMPTS.md`.
The course template documents setup for each supported editor.
[Course template README](https://github.com/YarivGilad/react-project-starter#readme)
