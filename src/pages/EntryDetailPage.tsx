import { Link, useParams } from 'react-router'
import { MONSTER_ENTRY_PREFIX } from '../bestiary/srd'
import { findBacklinks, getEntryKingdom, PLAYER_CHARACTER_KIND, type WorldEntry } from '../catalog/worldEntries'
import BackgroundMotionToggle, { type BackgroundMotion } from '../components/BackgroundMotionToggle'
import EntryLinks from '../components/EntryLinks'
import KingdomBackdrop from '../components/KingdomBackdrop'
import MonsterDetailPage from './MonsterDetailPage'
import NotFoundPage from './NotFoundPage'
import './kingdomEntry.css'

interface EntryDetailPageProps {
  entries: readonly WorldEntry[]
  backgroundMotion: BackgroundMotion
}

export default function EntryDetailPage({ entries, backgroundMotion }: EntryDetailPageProps) {
  const { id } = useParams<'id'>()

  if (id?.startsWith(MONSTER_ENTRY_PREFIX)) {
    const index = id.slice(MONSTER_ENTRY_PREFIX.length)
    if (/^[a-z0-9-]+$/.test(index)) {
      return <MonsterDetailPage index={index} backlinks={findBacklinks(entries, id)} />
    }
  }

  const entry = entries.find((item) => item.id === id)

  if (!entry) {
    return <NotFoundPage title="Entry not found" />
  }

  const kingdom = getEntryKingdom(entry, entries)
  const theme = kingdom?.kingdomTheme
  const affiliatedKingdom = kingdom?.id === entry.id ? undefined : kingdom
  const kingdomEntries = entry.kind === 'Kingdom' ? entries.filter((item) => item.kingdomId === entry.id) : []
  const relatedEntries = (entry.linkedEntries ?? []).map((link) => ({
    id: link.id,
    title: entries.find((item) => item.id === link.id)?.title ?? link.title ?? link.id,
  }))

  return (
    <>
      <Link className="back-link" to="/compendium">Back to compendium</Link>
      <article className={theme ? 'kingdom-entry realm-entry' : 'entry-detail'} data-realm-theme={theme}>
        <header className={theme ? `kingdom-hero${affiliatedKingdom ? ' kingdom-hero--article' : ''}` : undefined}>
          {theme && (
            <>
              <KingdomBackdrop theme={theme} />
              <BackgroundMotionToggle {...backgroundMotion} />
            </>
          )}
          <div>
            <div className={affiliatedKingdom ? 'entry-affiliation' : undefined}>
              <p className="entry-kind">{entry.kind}</p>
              {affiliatedKingdom && (
                <Link className="entry-link" to={`/compendium/${encodeURIComponent(affiliatedKingdom.id)}`}>
                  {affiliatedKingdom.title}
                </Link>
              )}
            </div>
            <h1>{entry.title}</h1>
          </div>
        </header>
        <div className={theme ? 'entry-detail kingdom-entry__body' : undefined}>
          <p className="entry-summary">{entry.summary}</p>
          <div className="entry-detail-actions">
            <Link className="back-link entry-edit-link" to={'/editor/' + entry.id}>Edit entry</Link>
            {entry.kind === PLAYER_CHARACTER_KIND && (
              <Link className="back-link entry-edit-link" to={'/characters/' + encodeURIComponent(entry.id)}>
                {entry.characterSheet ? 'View character sheet' : 'Add character sheet'}
              </Link>
            )}
          </div>
          <EntryLinks heading="Entries in this kingdom" entries={kingdomEntries} />
          <EntryLinks heading="Related entries" entries={relatedEntries} />
          <EntryLinks heading="Backlinks" entries={findBacklinks(entries, entry.id)} />
        </div>
      </article>
    </>
  )
}
