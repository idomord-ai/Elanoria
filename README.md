# Elanoria

A campaign compendium for Elanor. The planned app connects world articles and
portal collections to a live D&D bestiary.

## Run the initial project

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Use `npm run build` to build the app and `npm run lint` to check the code.
This checkpoint contains the Vite scaffold. The feature plan and acceptance
criteria are in [PRD.md](./PRD.md) and [tasks.md](./tasks.md).

## Course prompt log

The original course template contains prompt-logging configuration and
`scripts/log-prompt.mjs`. Start Codex CLI inside the repository and send a short
test prompt, then verify with `tail -n 20 PROMPTS.md`. The [course template
README](https://github.com/YarivGilad/react-project-starter#readme) documents
the setup and fallback for each supported editor.
