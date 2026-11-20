# Elanoria

A campaign compendium for Elanor that connects world articles and portal
collections to a live D&D bestiary.

## Run locally

Use Node.js 22.13+ on the Node 22 release line, Node.js 24, or Node.js 26+.

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

## Character sheets and local PDF import

Open **Characters** to create a player character or edit a sheet. Character
sheets and visual references are saved in this browser. Keep the same local
address and port to reopen them.

Open **Spells** to search the 2014 and 2024 SRDs. In a character sheet, use
**Add spells** and choose the edition for each spell before saving. A mixed
sheet can link to either edition, and each saved link opens that edition's
spell details. Spell content comes from the [D&D 5e SRD API](https://docs.dnd5eapi.co/2024/introduction)
and the [D&D System Reference Documents](https://www.dndbeyond.com/srd) (CC BY 4.0).

Use **Character art and visual references** on a character page to attach
JPEG, PNG or WebP files and add captions. In **Memoria**, create a collection
and record a memory, event or scene. Link its characters to open their visual
references from the record. These files and records stay in this browser.

The Windows PDF importer uses the official Sign in with ChatGPT DevKit.
It requires a ChatGPT account eligible for plan usage and asks for permission
in the browser. It uses Windows credential protection for saved sign-in data
and keeps those credentials outside the repository.

If the DevKit is not installed, clone [OpenAI's DevKit](https://github.com/openai/sign-in-with-chatgpt-devkit)
as a sibling folder named `siwc-devkit`. The importer was developed with DevKit
commit `0a36fefeb913055c8c7a1a29b63d82b96b2e841a`. In the DevKit folder, run
`npm ci --workspace @siwc/local --include-workspace-root --ignore-scripts`,
then `npm run build -w @siwc/local`. You can also set
`ELANORIA_SIWC_SDK` to the absolute path of its built `packages/local/dist/index.js`.

In Elanoria, run `npm ci` and `npm run dev:chatgpt` from your regular Windows
terminal. The helper needs network access to ChatGPT and access to your default
browser to start sign-in. Open
`http://127.0.0.1:5174/characters`, open a sheet in edit mode and select
**Import from PDF**. If you already have saved characters, start the helper on
the same port and keep using the same browser address so your saved data remains
available. Stop your previous Elanoria server first, then set
`ELANORIA_CHATGPT_PORT` to that port before running `npm run dev:chatgpt`. For
example, in PowerShell use `$env:ELANORIA_CHATGPT_PORT = '5173'` for port 5173.

Once connected, choose a PDF with selectable text or
filled PDF form fields. The local helper reads up to 20 pages and sends
extracted text to ChatGPT. Scans without text need OCR first. Review the
suggestions, apply the fields you want, edit them as needed and save the sheet.

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
