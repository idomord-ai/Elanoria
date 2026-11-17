import { useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes } from 'react-router'
import { useWorldEntries } from './catalog/useWorldEntries'
import CompendiumPage from './pages/CompendiumPage'
import EntryDetailPage from './pages/EntryDetailPage'
import EntryEditorPage from './pages/EntryEditorPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const [queries, setQueries] = useState({ elanor: '', bestiary: '' })
  const { entries, saveEntry } = useWorldEntries()

  return (
    <>
      <header className="site-header">
        <div className="frame header-content">
          <Link className="brand" to="/compendium">
            <span className="brand__mark" aria-hidden="true">✧</span>
            Elanoria
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/compendium" end>Compendium</NavLink>
            <NavLink to="/editor">Editor</NavLink>
          </nav>
        </div>
      </header>
      <main className="frame page">
        <Routes>
          <Route path="/" element={<Navigate to="/compendium" replace />} />
          <Route path="/compendium">
            <Route
              index
              element={
                <CompendiumPage
                  entries={entries}
                  queries={queries}
                  onQueryChange={(source, query) => setQueries((previous) => ({ ...previous, [source]: query }))}
                />
              }
            />
            <Route path=":id" element={<EntryDetailPage entries={entries} />} />
          </Route>
          <Route path="/editor/:id?" element={<EntryEditorPage entries={entries} onSave={saveEntry} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
