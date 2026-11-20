# Build tasks

0. [x] Scaffold Vite in the course template and define the product.
   Done when Vite builds, the prompt logger is preserved, and the PRD states five observable behaviors.
1. [x] Build the Elanor catalog from local JSON.
   Done when the catalog displays typed entries using stable keys and filters by name.
2. [x] Add React Router, navigation, and entry detail.
   Done when a catalog item opens its own URL and `useParams` resolves the selected entry.
3. [x] Connect the public D&D bestiary.
   Done when list and detail use `fetch` inside `useEffect` and show loading, error, and data states.
4. [x] Add Vitest and its browser UI.
   Done when at least five meaningful logic tests pass with `npm test` and appear with `npm run test:ui`.
5. [x] Build the editor and backlinks.
   Done when a saved entry survives refresh and appears on the page it links to.
6. [x] Build the Portal Nexus.
   Done when two portals can link to the same entry and reflect an edit to that entry.
7. [x] Finish responsive CSS and the README.
   Done when navigation and forms work on a narrow screen, the app builds, and the README explains how to run the app and tests.
8. [x] Give the Seven Kingdoms distinct page styles and add navigation feedback.
   Done when each kingdom and its affiliated entries share a palette, heading font, and animated atmosphere, new pages and navigation controls give quick feedback, and background motion can be paused.
9. [x] Add a global Roll dice tray to the top bar.
   Done when manual and character-sheet rolls show the right 3D dice and result, and mobile users can opt into holding, shaking, and releasing to throw.
   The tray also remembers the selected dice skin and shows the kept and dropped dice for d20 advantage and disadvantage.
10. [ ] Browse and manage connections between compendium entries.
    Done when users can find and link entries from an article and follow an expandable path through related entries and backlinks, including when links form a cycle.

After reviewing each task, record what you checked and what you changed in
`PROMPTS.md`, then commit the task and its log entry together.
