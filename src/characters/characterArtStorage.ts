export interface CharacterArt {
  id: string
  entryId: string
  filename: string
  caption: string
  createdAt: number
  image: Blob
}

const databaseName = 'elanoria.characterArt'
const storeName = 'images'
const entryIndex = 'entryId'
const maximumImageSize = 10 * 1024 * 1024

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(storeName, { keyPath: ['entryId', 'id'] })
      store.createIndex(entryIndex, 'entryId')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function runTransaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => () => T): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode)
      transaction.onabort = () => reject(transaction.error ?? new Error('Image storage was interrupted.'))
      const getResult = operation(transaction.objectStore(storeName))
      transaction.oncomplete = () => resolve(getResult())
    })
  } finally {
    database.close()
  }
}

async function readImageType(file: File): Promise<string> {
  if (file.size > maximumImageSize) throw new Error('Choose an image no larger than 10 MiB.')
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if ([0xff, 0xd8, 0xff].every((byte, index) => bytes[index] === byte)) return 'image/jpeg'
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return 'image/png'
  if (new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF'
    && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  throw new Error('Choose a JPEG, PNG or WebP image.')
}

function makeId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function loadCharacterArt(entryId: string): Promise<CharacterArt[]> {
  return runTransaction('readonly', (store) => {
    const request: IDBRequest<CharacterArt[]> = store.index(entryIndex).getAll(entryId)
    return () => request.result.sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id))
  })
}

export async function addCharacterArt(entryId: string, file: File): Promise<CharacterArt> {
  const imageType = await readImageType(file)
  const image = file.slice(0, file.size, imageType)
  try {
    const bitmap = await createImageBitmap(image)
    bitmap.close()
  } catch {
    throw new Error('This image could not be read. Choose another JPEG, PNG or WebP file.')
  }
  const art: CharacterArt = {
    id: makeId(),
    entryId,
    filename: file.name,
    caption: '',
    createdAt: Date.now(),
    image,
  }
  try {
    return await runTransaction('readwrite', (store) => {
      store.add(art)
      return () => art
    })
  } catch {
    throw new Error('Could not save this image in this browser. Check that local storage is available.')
  }
}

export async function updateCharacterArtCaption(entryId: string, id: string, caption: string): Promise<void> {
  const updated = await runTransaction('readwrite', (store) => {
    let exists = false
    const request: IDBRequest<CharacterArt | undefined> = store.get([entryId, id])
    request.onsuccess = () => {
      const art = request.result
      if (art) {
        store.put({ ...art, caption: caption.trim() })
        exists = true
      }
    }
    return () => exists
  })
  if (!updated) throw new Error('This image is no longer available.')
}

export function removeCharacterArt(entryId: string, id: string): Promise<void> {
  return runTransaction('readwrite', (store) => {
    store.delete([entryId, id])
    return () => undefined
  })
}
