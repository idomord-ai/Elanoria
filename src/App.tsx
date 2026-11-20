import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { useWorldEntries } from './catalog/useWorldEntries'
import DiceTray, { type DicePreset } from './dice/DiceTray'
import CharacterSheetPage from './pages/CharacterSheetPage'
import CharactersPage from './pages/CharactersPage'
import CompendiumPage from './pages/CompendiumPage'
import EntryDetailPage from './pages/EntryDetailPage'
import EntryEditorPage from './pages/EntryEditorPage'
import MemoriaPage from './pages/MemoriaPage'
import NotFoundPage from './pages/NotFoundPage'
import PortalsPage from './pages/PortalsPage'
import SpellDetailPage from './pages/SpellDetailPage'
import SpellsPage from './pages/SpellsPage'

export default function App() {
  const [queries, setQueries] = useState({ elanor: '', bestiary: '' })
  const [backgroundMotionPaused, setBackgroundMotionPaused] = useState(false)
  const [diceTrayOpen, setDiceTrayOpen] = useState(false)
  const [dicePreset, setDicePreset] = useState<DicePreset>()
  const { entries, saveEntry } = useWorldEntries()
  const { pathname } = useLocation()
  const pageRef = useRef<HTMLElement>(null)
  const backgroundMotion = {
    paused: backgroundMotionPaused,
    onToggle: () => setBackgroundMotionPaused((paused) => !paused),
  }

  function openDiceTray(preset?: DicePreset) {
    setDicePreset(preset)
    setDiceTrayOpen(true)
  }

  useLayoutEffect(() => {
    const page = pageRef.current
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!page?.animate || motionPreference.matches) return

    const animation = page.animate([
      { opacity: 0.8, transform: 'translateY(6px) scale(0.985)', transformOrigin: 'top center' },
      { opacity: 1, transform: 'translateY(-1px) scale(1.004)', transformOrigin: 'top center', offset: 0.7 },
      { opacity: 1, transform: 'none', transformOrigin: 'top center' },
    ], { duration: 240, easing: 'ease-out' })
    const stopAnimation = () => animation.cancel()

    motionPreference.addEventListener('change', stopAnimation)
    return () => {
      motionPreference.removeEventListener('change', stopAnimation)
      stopAnimation()
    }
  }, [pathname])

  return (
    <>
      <header className="site-header">
        <div className="frame header-content">
          <div className="header-tools">
            <Link className="brand" to="/compendium">
              <span className="brand__mark" aria-hidden="true">✧</span>
              Elanoria
            </Link>
            <button
              className="header-dice"
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                openDiceTray()
              }}
            >
              <span aria-hidden="true">⚄</span>
              Roll dice
            </button>
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/compendium" end>Compendium</NavLink>
            <NavLink to="/characters">Characters</NavLink>
            <NavLink to="/spells">Spells</NavLink>
            <NavLink to="/memoria">Memoria</NavLink>
            <NavLink to="/portals">Portals</NavLink>
            <NavLink to="/editor">Editor</NavLink>
          </nav>
        </div>
      </header>
      <main ref={pageRef} className="frame page" data-background-motion={backgroundMotionPaused ? 'paused' : undefined}>
        <Routes>
          <Route path="/" element={<Navigate to="/compendium" replace />} />
          <Route path="/compendium">
            <Route
              index
              element={
                <CompendiumPage
                  entries={entries}
                  queries={queries}
                  backgroundMotion={backgroundMotion}
                  onQueryChange={(source, query) => setQueries((previous) => ({ ...previous, [source]: query }))}
                />
              }
            />
            <Route path=":id" element={<EntryDetailPage entries={entries} backgroundMotion={backgroundMotion} />} />
          </Route>
          <Route path="/editor/:id?" element={<EntryEditorPage entries={entries} onSave={saveEntry} />} />
          <Route path="/characters" element={<CharactersPage entries={entries} />} />
          <Route path="/characters/:id" element={<CharacterSheetPage entries={entries} onSave={saveEntry} onRoll={openDiceTray} />} />
          <Route path="/spells" element={<SpellsPage />} />
          <Route path="/spells/:edition/:index" element={<SpellDetailPage />} />
          <Route path="/memoria" element={<MemoriaPage entries={entries} />} />
          <Route path="/portals" element={<PortalsPage entries={entries} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <DiceTray open={diceTrayOpen} preset={dicePreset} onClose={() => setDiceTrayOpen(false)} />
    </>
  )
}
