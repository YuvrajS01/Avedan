/**
 * Minimal ZIP creator for V3 kit export (T025).
 *
 * No dependencies — implements the ZIP spec subset needed for Avedan:
 * STORE (no compression) local headers + central directory + EOCD.
 * Produced ZIPs contain already-compressed JPEG/PNG blobs, so STORE is
 * optimal and avoids a compression library. Keeps bundle weight ~2 KB.
 *
 * Reference: PKWARE APPNOTE 6.3.9, but only the required fields.
 */

function crc32(data: Uint8Array): number {
  // Precomputed table for speed (standard polynomial 0xEDB88320).
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0 ^ -1
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time: ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff,
    date: (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff,
  }
}

function writeU16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true)
}
function writeU32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true)
}

export interface ZipEntry {
  /** File name inside the ZIP (UTF-8, no directory). */
  name: string
  /** Raw file bytes. */
  data: Uint8Array
}

/**
 * Create a ZIP Blob containing the given entries (STORE).
 * Returns a Blob with MIME `application/zip`.
 */
export function createZipBlob(entries: ZipEntry[], modifiedDate = new Date()): Blob {
  const encodedNames = entries.map((entry) => new TextEncoder().encode(entry.name))
  const crcs = entries.map((entry) => crc32(entry.data))
  const dt = dosDateTime(modifiedDate)

  // Sizes: local header (30 + nameLen) per file + central header (46 + nameLen) per file + EOCD (22)
  let localSize = 0
  let centralSize = 0
  for (let i = 0; i < entries.length; i++) {
    localSize += 30 + encodedNames[i].length + entries[i].data.length
    centralSize += 46 + encodedNames[i].length
  }
  const eocdSize = 22
  const totalSize = localSize + centralSize + eocdSize
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  let offset = 0
  const localOffsets: number[] = []

  // Local file headers + data
  for (let i = 0; i < entries.length; i++) {
    const nameLen = encodedNames[i].length
    const dataLen = entries[i].data.length
    localOffsets.push(offset)

    writeU32(view, offset, 0x04034b50) // local file header signature
    writeU16(view, offset + 4, 20) // version needed to extract
    writeU16(view, offset + 6, 0x0800) // general purpose flag: UTF-8
    writeU16(view, offset + 8, 0) // compression method STORE
    writeU16(view, offset + 10, dt.time)
    writeU16(view, offset + 12, dt.date)
    writeU32(view, offset + 14, crcs[i])
    writeU32(view, offset + 18, dataLen) // compressed size (STORE = uncompressed)
    writeU32(view, offset + 22, dataLen) // uncompressed size
    writeU16(view, offset + 26, nameLen)
    writeU16(view, offset + 28, 0) // extra field length
    offset += 30
    bytes.set(encodedNames[i], offset)
    offset += nameLen
    bytes.set(entries[i].data, offset)
    offset += dataLen
  }

  const centralOffset = offset
  // Central directory headers
  for (let i = 0; i < entries.length; i++) {
    const nameLen = encodedNames[i].length
    const dataLen = entries[i].data.length
    writeU32(view, offset, 0x02014b50) // central directory header signature
    writeU16(view, offset + 4, 20) // version made by
    writeU16(view, offset + 6, 20) // version needed to extract
    writeU16(view, offset + 8, 0x0800) // flag UTF-8
    writeU16(view, offset + 10, 0) // STORE
    writeU16(view, offset + 12, dt.time)
    writeU16(view, offset + 14, dt.date)
    writeU32(view, offset + 16, crcs[i])
    writeU32(view, offset + 20, dataLen)
    writeU32(view, offset + 24, dataLen)
    writeU16(view, offset + 28, nameLen)
    writeU16(view, offset + 30, 0) // extra len
    writeU16(view, offset + 32, 0) // comment len
    writeU16(view, offset + 34, 0) // disk number start
    writeU16(view, offset + 36, 0) // internal attributes
    writeU32(view, offset + 38, 0) // external attributes
    writeU32(view, offset + 42, localOffsets[i])
    offset += 46
    bytes.set(encodedNames[i], offset)
    offset += nameLen
  }

  // End of central directory
  writeU32(view, offset, 0x06054b50) // EOCD signature
  writeU16(view, offset + 4, 0) // disk number
  writeU16(view, offset + 6, 0) // central dir disk
  writeU16(view, offset + 8, entries.length) // entries on this disk
  writeU16(view, offset + 10, entries.length) // total entries
  writeU32(view, offset + 12, centralSize)
  writeU32(view, offset + 16, centralOffset)
  writeU16(view, offset + 20, 0) // comment length

  return new Blob([buffer], { type: 'application/zip' })
}

/** Convenience: Blob → Uint8Array (for tests / zip creation from Blobs). */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  if (typeof (blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
    return new Uint8Array(await (blob as Blob & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer())
  }
  // jsdom fallback via FileReader
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
  return new Uint8Array(buffer)
}
