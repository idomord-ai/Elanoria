import { Link, useParams } from 'react-router'
import { MONSTER_ENTRY_PREFIX } from '../bestiary/srd'
import { findBacklinks, type WorldEntry } from '../catalog/worldEntries'
import EntryLinks from '../components/EntryLinks'
import MonsterDetailPage from './MonsterDetailPage'
import NotFoundPage from './NotFoundPage'

export default function EntryDetailPage({ entries }: { entries: readonly WorldEntry[] }) {
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

  const relatedEntries = (entry.linkedEntries ?? []).map((link) => ({
    id: link.id,
    title: entries.find((item) => item.id === link.id)?.title ?? link.title ?? link.id,
  }))

  return (
    <>
      <Link className="back-link" to="/compendium">Back to compendium</Link>
      <article className="entry-detail">
        <p className="entry-kind">{entry.kind}</p>
        <h1>{entry.title}</h1>
        <p className="entry-summary">{entry.summary}</p>
        <Link className="back-link entry-edit-link" to={'/editor/' + entry.id}>Edit entry</Link>
        <EntryLinks heading="Related entries" entries={relatedEntries} />
        <EntryLinks heading="Backlinks" entries={findBacklinks(entries, entry.id)} />
      </article>
    </>
  )
}
