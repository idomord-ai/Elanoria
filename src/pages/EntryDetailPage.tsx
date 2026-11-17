import { Link, useParams } from 'react-router'
import { MONSTER_ENTRY_PREFIX } from '../bestiary/srd'
import { worldEntries } from '../catalog/worldEntries'
import MonsterDetailPage from './MonsterDetailPage'
import NotFoundPage from './NotFoundPage'

export default function EntryDetailPage() {
  const { id } = useParams<'id'>()

  if (id?.startsWith(MONSTER_ENTRY_PREFIX)) {
    const index = id.slice(MONSTER_ENTRY_PREFIX.length)
    if (/^[a-z0-9-]+$/.test(index)) {
      return <MonsterDetailPage index={index} />
    }
  }

  const entry = worldEntries.find((item) => item.id === id)

  if (!entry) {
    return <NotFoundPage title="Entry not found" />
  }

  return (
    <>
      <Link className="back-link" to="/compendium">Back to compendium</Link>
      <article className="entry-detail">
        <p className="entry-kind">{entry.kind}</p>
        <h1>{entry.title}</h1>
        <p className="entry-summary">{entry.summary}</p>
      </article>
    </>
  )
}
