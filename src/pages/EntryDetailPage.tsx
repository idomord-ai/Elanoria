import { Link, useParams } from 'react-router'
import { worldEntries } from '../catalog/worldEntries'
import NotFoundPage from './NotFoundPage'

export default function EntryDetailPage() {
  const { id } = useParams<'id'>()
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
