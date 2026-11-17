# Elanoria

A campaign compendium for Elanor. The planned app connects world articles and
portal collections to a live D&D bestiary.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Use `npm run build` to build the app and `npm run lint` to check the code.
The catalog at `/compendium` searches local Elanor entries and the D&D Bestiary
by name. Each entry has a detail page at `/compendium/:id`.
The feature plan and acceptance criteria are in [PRD.md](./PRD.md) and
[tasks.md](./tasks.md).

## Bestiary credits

The D&D Bestiary fetches monster data from the [D&D 5e SRD API](https://www.dnd5eapi.co/).
Monster material comes from Wizards of the Coast LLC's
[System Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document),
licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/legalcode).

## Course prompt log

The original course template contains prompt-logging configuration and
`scripts/log-prompt.mjs`. Start Codex CLI inside the repository and send a short
test prompt, then verify with `tail -n 20 PROMPTS.md`. The [course template
README](https://github.com/YarivGilad/react-project-starter#readme) documents
the setup and fallback for each supported editor.
