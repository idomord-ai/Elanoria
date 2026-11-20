import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import {
  addCharacterArt,
  loadCharacterArt,
  removeCharacterArt,
  updateCharacterArtCaption,
  type CharacterArt,
} from './characterArtStorage'
import './characterArt.css'

type GalleryState =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; images: CharacterArt[] }

interface ArtCardProps {
  art: CharacterArt
  onSaveCaption: (caption: string) => Promise<boolean>
  onRemove: () => Promise<void>
}

function ArtCard({ art, onSaveCaption, onRemove }: ArtCardProps) {
  const name = art.filename || 'Image'
  const label = art.caption || name
  const dialogHeading = useId()
  const titleId = useId()
  const preview = useRef<HTMLDialogElement>(null)
  const thumbnailImage = useRef<HTMLImageElement>(null)
  const previewImage = useRef<HTMLImageElement>(null)
  const [caption, setCaption] = useState<string>()
  const [savingCaption, setSavingCaption] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(art.image)
    if (thumbnailImage.current) thumbnailImage.current.src = url
    if (previewImage.current) previewImage.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [art.image])

  async function saveCaption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (caption === undefined || savingCaption) return
    setSavingCaption(true)
    if (await onSaveCaption(caption)) setCaption(undefined)
    setSavingCaption(false)
  }

  return (
    <article className="character-art__card" aria-labelledby={titleId}>
      <button className="character-art__thumbnail" type="button" onClick={() => preview.current?.showModal()} aria-label="Preview image" aria-describedby={titleId}>
        <img ref={thumbnailImage} alt={label} loading="lazy" />
      </button>
      <div className="character-art__details">
        <h3 id={titleId}>{name}</h3>
        {caption === undefined ? (
          <>
            {art.caption && <p className="character-art__caption">{art.caption}</p>}
            <div className="character-art__actions">
              <button type="button" onClick={() => setCaption(art.caption)}>Edit caption</button>
              <button type="button" onClick={() => void onRemove()}>Remove image</button>
            </div>
          </>
        ) : (
          <form className="character-art__caption-form" onSubmit={(event) => void saveCaption(event)}>
            <label className="editor-field">
              Caption
              <textarea value={caption} disabled={savingCaption} onChange={(event) => setCaption(event.currentTarget.value)} rows={2} maxLength={400} />
            </label>
            <div className="character-art__actions">
              <button type="submit" disabled={savingCaption}>Save caption</button>
              <button type="button" disabled={savingCaption} onClick={() => setCaption(undefined)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
      <dialog className="character-art__preview" ref={preview} aria-labelledby={dialogHeading}>
        <div className="character-art__preview-header">
          <h3 id={dialogHeading}>{name}</h3>
          <button type="button" onClick={() => preview.current?.close()}>Close preview</button>
        </div>
        <img ref={previewImage} alt={label} loading="lazy" />
        {art.caption && <p className="character-art__caption">{art.caption}</p>}
      </dialog>
    </article>
  )
}

export default function CharacterArtGallery({ entryId }: { entryId: string }) {
  const headingId = useId()
  const rulesId = useId()
  const section = useRef<HTMLElement>(null)
  const { hash } = useLocation()
  const [state, setState] = useState<GalleryState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (hash === '#character-art') section.current?.scrollIntoView()
  }, [hash])

  useEffect(() => {
    let relevant = true
    void loadCharacterArt(entryId).then(
      (images) => { if (relevant) setState({ status: 'ready', images }) },
      () => { if (relevant) setState({ status: 'error' }) },
    )
    return () => { relevant = false }
  }, [entryId, attempt])

  async function upload(file: File) {
    setUploading(true)
    setError('')
    setAnnouncement('')
    try {
      const art = await addCharacterArt(entryId, file)
      setState((previous) => previous.status === 'ready'
        ? { ...previous, images: [art, ...previous.images] }
        : previous)
      setAnnouncement('Image added.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not add this image.')
    } finally {
      setUploading(false)
    }
  }

  async function saveCaption(id: string, caption: string) {
    setError('')
    setAnnouncement('')
    try {
      await updateCharacterArtCaption(entryId, id, caption)
      setState((previous) => previous.status === 'ready' ? {
        ...previous,
        images: previous.images.map((art) => art.id === id ? { ...art, caption: caption.trim() } : art),
      } : previous)
      setAnnouncement('Caption saved.')
      return true
    } catch {
      setError('Could not save this caption. Try again.')
      return false
    }
  }

  async function remove(id: string) {
    setError('')
    setAnnouncement('')
    try {
      await removeCharacterArt(entryId, id)
      setState((previous) => previous.status === 'ready'
        ? { ...previous, images: previous.images.filter((art) => art.id !== id) }
        : previous)
      setAnnouncement('Image removed.')
    } catch {
      setError('Could not remove this image. Try again.')
    }
  }

  return (
    <section ref={section} className="character-art" id="character-art" aria-labelledby={headingId}>
      <h2 id={headingId}>Character art and visual references</h2>
      {state.status === 'loading' && <p role="status">Loading images…</p>}
      {state.status === 'error' && (
        <div className="character-art__actions">
          <p className="editor-error" role="alert">Could not load images in this browser.</p>
          <button type="button" onClick={() => {
            setState({ status: 'loading' })
            setAttempt((previous) => previous + 1)
          }}>Retry</button>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          <label className="editor-field character-art__upload">
            Add image
            <input
              aria-describedby={rulesId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) void upload(file)
              }}
            />
          </label>
          <p id={rulesId} className="character-art__hint">JPEG, PNG or WebP, up to 10 MiB each. Images are saved in this browser.</p>
          {uploading && <p role="status">Saving image…</p>}
          {error && <p role="alert" className="editor-error">{error}</p>}
          {announcement && <p role="status" className="character-art__status">{announcement}</p>}
          {state.images.length === 0 ? <p className="character-art__hint">No images saved yet.</p> : (
            <div className="character-art__grid">
              {state.images.map((art) => (
                <ArtCard key={art.id} art={art} onSaveCaption={(caption) => saveCaption(art.id, caption)} onRemove={() => remove(art.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
