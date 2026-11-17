# Elanoria

Elanoria is a campaign compendium for an Elanor game master. It connects the
world's people, places, and stories to each other and to a live D&D bestiary.

## Pages

- `/compendium` searches Elanor articles and the public D&D bestiary.
- `/compendium/:id` opens an article or monster stat block with related entries.
- `/portals` is the Portal Nexus. A portal collects links to existing entries.
- `/editor` creates and edits Elanor articles. The GM can link existing entries
  and API monsters by name.

Articles and portals are saved in the current browser. The catalog reads
monster data from the D&D 5e SRD API (2014).

## Acceptance criteria

- When I search either catalog by name, I see matching records and can open a
  specific record at its own URL.
- When I open a monster, I see its AC, HP, challenge rating, traits, and actions.
- When I save a new article linked to Basilisk, I see that article in the
  backlinks on Basilisk's page.
- When I add the same entry to two portals and edit its title, I see the new
  title in both portals.
- When I refresh after saving an article or portal, I see the saved content.
