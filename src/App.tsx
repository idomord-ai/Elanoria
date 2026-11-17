import { useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import CompendiumPage from './pages/CompendiumPage'
import EntryDetailPage from './pages/EntryDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const [queries, setQueries] = useState({ elanor: '', bestiary: '' })

  return (
    <>
      <header className="site-header">
        <div className="frame header-content">
          <span className="brand">Elanoria</span>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/compendium" end>Compendium</NavLink>
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
                  queries={queries}
                  onQueryChange={(source, query) => setQueries((previous) => ({ ...previous, [source]: query }))}
                />
              }
            />
            <Route path=":id" element={<EntryDetailPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
