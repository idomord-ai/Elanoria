import { Link } from 'react-router'

interface NotFoundPageProps {
  title?: string
}

export default function NotFoundPage({ title = 'Page not found' }: NotFoundPageProps) {
  return (
    <>
      <h1>{title}</h1>
      <Link className="back-link" to="/compendium">Back to compendium</Link>
    </>
  )
}
