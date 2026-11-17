import { Link } from 'react-router'

interface EntryLinksProps {
  heading: string
  entries: readonly { id: string; title: string }[]
}

export default function EntryLinks({ heading, entries }: EntryLinksProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <section className="entry-links">
      <h2>{heading}</h2>
      <ul>
        {entries.map(({ id, title }) => (
          <li key={id}><Link className="entry-link" to={'/compendium/' + id}>{title}</Link></li>
        ))}
      </ul>
    </section>
  )
}
