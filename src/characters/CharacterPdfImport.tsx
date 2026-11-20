import { useEffect, useId, useRef, useState } from 'react'
import { parseCharacterPdfDraft, type CharacterPdfDraft } from './characterPdfDraft'
import { abilities, editionNames, type Ability } from './characterSheets'
import './characterPdfImport.css'

const pdfSizeLimit = 10 * 1024 * 1024
const manageUsageUrl = 'https://chatgpt.com/settings/usage'
const details = {
  edition: 'Rules edition',
  className: 'Class',
  subclassName: 'Subclass',
  ancestry: 'Race or species',
  background: 'Background',
  level: 'Level',
  armorClass: 'Armor class',
  currentHitPoints: 'Current hit points',
  maxHitPoints: 'Maximum hit points',
} as const satisfies Record<Exclude<keyof CharacterPdfDraft, 'abilityScores'>, string>

type ImportField = keyof typeof details | Ability
type Connection = 'unknown' | 'connected' | 'disconnected'
type Operation = 'checking' | 'connecting' | 'disconnecting' | 'reading'

class ChatGptRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function getReviewFields(draft: CharacterPdfDraft) {
  const fields: { field: ImportField; label: string; value: string | number }[] = []
  for (const field of Object.keys(details) as (keyof typeof details)[]) {
    const value = field === 'edition' && draft.edition !== undefined ? editionNames[draft.edition] : draft[field]
    if (value !== undefined) fields.push({ field, label: details[field], value })
  }
  for (const field of abilities) {
    const value = draft.abilityScores?.[field]
    if (value !== undefined) fields.push({ field, label: field.charAt(0).toUpperCase() + field.slice(1), value })
  }
  return fields
}

function getSelectedDraft(draft: CharacterPdfDraft, selected: ReadonlySet<ImportField>): CharacterPdfDraft {
  const selectedDraft = Object.fromEntries(
    (Object.keys(details) as (keyof typeof details)[])
      .filter((field) => selected.has(field))
      .map((field) => [field, draft[field]]),
  )
  const abilityScores = Object.fromEntries(
    abilities.filter((ability) => selected.has(ability)).map((ability) => [ability, draft.abilityScores?.[ability]]),
  )
  return { ...selectedDraft, abilityScores }
}

async function readJson(path: string, init: RequestInit) {
  let response: Response
  try {
    response = await fetch(`/api/chatgpt/${path}`, init)
  } catch {
    throw new Error('Could not reach the local ChatGPT helper. Check that Elanoria is running with npm run dev:chatgpt.')
  }

  if (response.status === 404 || response.headers.get('Content-Type')?.startsWith('text/html')) {
    throw new Error('This Elanoria server is running without PDF import. Start it with npm run dev:chatgpt.')
  }
  const result: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'The ChatGPT helper could not complete the request. Check the connection and try again.'
    throw new ChatGptRequestError(message, response.status)
  }
  if (!result || typeof result !== 'object') throw new Error('The local ChatGPT helper returned an unexpected response.')
  return result
}

async function checkConnection(path: 'status' | 'connect' | 'disconnect', signal: AbortSignal) {
  const response = await readJson(path, { method: path === 'status' ? 'GET' : 'POST', signal })
  if (!('connected' in response) || typeof response.connected !== 'boolean') {
    throw new Error('Could not check the ChatGPT connection.')
  }
  return {
    connected: response.connected,
    connecting: 'connecting' in response && response.connecting === true,
    accountLabel: 'accountLabel' in response && typeof response.accountLabel === 'string' ? response.accountLabel : undefined,
    error: 'error' in response && typeof response.error === 'string' ? response.error : undefined,
  }
}

interface CharacterPdfImportProps {
  onApply: (draft: CharacterPdfDraft) => void
}

export default function CharacterPdfImport({ onApply }: CharacterPdfImportProps) {
  const reviewId = useId()
  const [connection, setConnection] = useState<Connection>('unknown')
  const [accountLabel, setAccountLabel] = useState<string>()
  const [operation, setOperation] = useState<Operation>()
  const [file, setFile] = useState<File>()
  const [draft, setDraft] = useState<CharacterPdfDraft>()
  const [selected, setSelected] = useState<ReadonlySet<ImportField>>(new Set())
  const [status, setStatus] = useState('')
  const [error, setError] = useState<{ message: string; usageLimit?: boolean }>()
  const activeRequest = useRef<AbortController>(null)
  const statusMessage = useRef<HTMLParagraphElement>(null)

  useEffect(() => () => activeRequest.current?.abort(), [])

  async function run(operation: Operation, action: (signal: AbortSignal) => Promise<void>) {
    if (activeRequest.current) return
    const controller = new AbortController()
    activeRequest.current = controller
    setOperation(operation)
    setStatus('')
    setError(undefined)

    try {
      await action(controller.signal)
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof ChatGptRequestError && failure.status === 401) {
          setConnection('disconnected')
          setAccountLabel(undefined)
        }
        setError({
          message: failure instanceof Error ? failure.message : 'Something went wrong while importing the PDF.',
          usageLimit: failure instanceof ChatGptRequestError && failure.status === 429,
        })
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
        if (!controller.signal.aborted) setOperation(undefined)
      }
    }
  }

  function updateConnection(connect: boolean) {
    return run(connect ? 'connecting' : 'checking', async (signal) => {
      const result = await checkConnection(connect ? 'connect' : 'status', signal)
      if (signal.aborted) return
      setConnection(result.connected ? 'connected' : 'disconnected')
      setAccountLabel(result.accountLabel)
      if (result.error) setError({ message: result.error })
      else if (result.connected) setStatus('Connected to ChatGPT. You can read a PDF now.')
      else if (result.connecting) setStatus('Sign-in is in progress. Complete the ChatGPT prompt in your browser, then check again.')
      else setStatus('The local helper is ready. Choose Continue with ChatGPT to sign in.')
    })
  }

  function cancelSignIn() {
    const request = activeRequest.current
    if (!request || operation !== 'connecting') return
    activeRequest.current = null
    request.abort()
    setOperation(undefined)
    setStatus('Sign-in cancelled. Choose Continue with ChatGPT to try again.')
  }

  function disconnect() {
    return run('disconnecting', async (signal) => {
      const result = await checkConnection('disconnect', signal)
      if (signal.aborted) return
      setConnection(result.connected ? 'connected' : 'disconnected')
      setAccountLabel(result.accountLabel)
      setStatus('Disconnected from ChatGPT.')
    })
  }

  function selectFile(selection: File | undefined) {
    setDraft(undefined)
    setSelected(new Set())
    setStatus('')
    if (selection && !selection.name.toLowerCase().endsWith('.pdf')) {
      setFile(undefined)
      setError({ message: 'Choose a PDF file.' })
    } else if (selection && selection.size === 0) {
      setFile(undefined)
      setError({ message: 'Choose a PDF with a character sheet.' })
    } else if (selection && selection.size > pdfSizeLimit) {
      setFile(undefined)
      setError({ message: 'Choose a PDF that is 10 MB or smaller.' })
    } else {
      setFile(selection)
      setError(undefined)
    }
  }

  function readPdf() {
    if (!file) return
    return run('reading', async (signal) => {
      setDraft(undefined)
      setSelected(new Set())
      const result = await readJson('character-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
        signal,
      })
      if (signal.aborted) return
      if (!('draft' in result)) throw new Error('The ChatGPT helper returned no character draft.')
      const imported = parseCharacterPdfDraft(result.draft)
      setDraft(imported)
      setSelected(new Set())
      setStatus('Review the extracted fields and select the ones you want to apply.')
    })
  }

  function toggleField(field: ImportField, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (checked) next.add(field)
      else next.delete(field)
      return next
    })
  }

  function apply() {
    if (!draft || selected.size === 0) return
    onApply(getSelectedDraft(draft, selected))
    setDraft(undefined)
    setSelected(new Set())
    setStatus('Selected fields applied. Review the character sheet and save it when ready.')
    statusMessage.current?.focus()
  }

  const reviewFields = draft ? getReviewFields(draft) : []
  const operationStatus: Record<Operation, string> = {
    checking: 'Checking the ChatGPT connection…',
    connecting: 'Starting ChatGPT sign-in. Complete the prompt when it opens in your browser.',
    disconnecting: 'Disconnecting ChatGPT…',
    reading: 'Reading the PDF with ChatGPT…',
  }

  return (
    <details className="character-pdf" onToggle={(event) => {
      if (event.currentTarget.open && connection === 'unknown' && !operation) void updateConnection(false)
    }}>
      <summary>Import from PDF</summary>
      <div className="character-pdf__body">
        <div className="character-pdf__connection">
          {connection === 'connected' ? (
            <p>{accountLabel && <>{accountLabel} · </>}Using ChatGPT plan.</p>
          ) : <p>Connect to read a PDF using your ChatGPT plan.</p>}
          <div className="character-pdf__actions">
            {connection === 'connected' ? (
              <>
                <a className="back-link" href={manageUsageUrl} target="_blank" rel="noreferrer">Manage usage</a>
                <button type="button" disabled={Boolean(operation)} onClick={() => void disconnect()}>Disconnect account</button>
              </>
            ) : (
              <button type="button" disabled={Boolean(operation)} onClick={() => void updateConnection(true)}>
                Continue with ChatGPT
              </button>
            )}
            <button type="button" disabled={Boolean(operation)} onClick={() => void updateConnection(false)}>Check connection</button>
            {operation === 'connecting' && <button type="button" onClick={cancelSignIn}>Cancel sign-in</button>}
          </div>
        </div>
        <p className="character-pdf__status" role="status" tabIndex={-1} ref={statusMessage}>
          {operation ? operationStatus[operation] : status}
        </p>
        {error && (
          <p className="editor-error" role="alert">
            {error.message}
            {error.usageLimit && <> <a className="back-link" href={manageUsageUrl} target="_blank" rel="noreferrer">Manage usage</a></>}
          </p>
        )}
        <label className="editor-field">
          Character sheet PDF
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={operation === 'reading'}
            onChange={(event) => selectFile(event.currentTarget.files?.[0])}
          />
        </label>
        <p className="character-pdf__hint">
          This sends text extracted from the PDF to ChatGPT. Choose a PDF up to 10 MB with selectable text. Image-only scans need OCR first.
        </p>
        <div className="character-pdf__actions">
          <button type="button" disabled={!file || connection !== 'connected' || Boolean(operation)} onClick={() => void readPdf()}>
            Read PDF with ChatGPT
          </button>
        </div>
        {reviewFields.length > 0 && (
          <section className="character-pdf__review" aria-labelledby={reviewId}>
            <h2 id={reviewId}>Review extracted fields</h2>
            <ul>
              {reviewFields.map(({ field, label, value }) => (
                <li key={field}>
                  <label>
                    <input
                      type="checkbox"
                      aria-label={`Import ${label}`}
                      aria-describedby={`${reviewId}-${field}`}
                      checked={selected.has(field)}
                      onChange={(event) => toggleField(field, event.currentTarget.checked)}
                    />
                    <span>Import {label}</span>
                    <strong id={`${reviewId}-${field}`}>{value}</strong>
                  </label>
                </li>
              ))}
            </ul>
            <div className="character-pdf__actions">
              <button type="button" onClick={() => setSelected(new Set(reviewFields.map(({ field }) => field)))}>Select all</button>
              <button type="button" onClick={apply} disabled={selected.size === 0}>Apply selected fields</button>
            </div>
          </section>
        )}
      </div>
    </details>
  )
}
