/**
 * Minimal CSV parser for V4 institution dataset (T028).
 * Local only, no upload, no new deps, handles quoted fields and commas.
 * Privacy: parsed rows stay in memory, never leave the browser.
 */

export interface ParsedCSV {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * Parse CSV text into headers + rows.
 * - First non-empty line is headers (trimmed, lowercased for case-insensitive matching, but original kept as lowercased)
 * - Handles quoted fields with embedded commas and escaped double quotes ("")
 * - Trims whitespace from headers and values
 * - Skips empty lines
 */
export function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseLine(lines[0]).map((header) => header.trim().toLowerCase())
  if (headers.length === 0 || headers.every((header) => header === '')) {
    return { headers: [], rows: [] }
  }

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    // Skip rows that are entirely empty
    if (values.every((value) => value.trim() === '')) continue
    const row: Record<string, string> = {}
    for (let col = 0; col < headers.length; col++) {
      const header = headers[col]
      if (!header) continue
      row[header] = (values[col] ?? '').trim()
    }
    // Include extra columns beyond headers as _extra_{index}
    for (let col = headers.length; col < values.length; col++) {
      row[`_extra_${col}`] = values[col].trim()
    }
    rows.push(row)
  }

  return { headers, rows }
}

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  // Remove outer quotes and unescape if needed (already handled above, but trim)
  return result.map((value) => {
    let trimmed = value.trim()
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
      trimmed = trimmed.slice(1, -1).replace(/""/g, '"')
    }
    return trimmed
  })
}

/**
 * Match files to dataset rows by filename basename (case-insensitive).
 * For each file, find the first row where any field value equals the file's
 * basename (with or without extension) or full filename, case-insensitive.
 * This handles typical CSVs where a "photo" column contains "rahul.jpg" matching file "rahul.jpg" or "Rahul.JPG".
 */
export interface DatasetMatch {
  matched: Array<{ row: Record<string, string>; file: File; rowIndex: number }>
  unmatchedFiles: File[]
  unmatchedRows: Array<{ row: Record<string, string>; rowIndex: number }>
}

function normalizeFileName(value: string): string {
  // Extract basename, remove path components, lowercased
  const basename = value.split(/[\\/]/).pop() ?? value
  return basename.toLowerCase().trim()
}

export function matchDatasetToFiles(
  files: File[],
  rows: Record<string, string>[],
): DatasetMatch {
  const matched: DatasetMatch['matched'] = []
  const unmatchedFiles: File[] = []
  const matchedRowIndices = new Set<number>()

  // Build a map from normalized CSV field values to row indices for faster lookup
  // For each row, collect all normalized field values that look like filenames (contain a dot or are non-empty)
  const rowValuesMap = rows.map((row, index) => ({
    row,
    index,
    normalizedValues: Object.values(row).map(normalizeFileName).filter((value) => value.length > 0),
  }))

  for (const file of files) {
    const fileNameNormalized = normalizeFileName(file.name)
    const fileBaseWithoutExt = fileNameNormalized.replace(/\.[^.]+$/, '')
    let found: { row: Record<string, string>; rowIndex: number } | null = null

    for (const { row, index, normalizedValues } of rowValuesMap) {
      if (matchedRowIndices.has(index)) continue
      // Check if any field value matches file name (full) or basename without ext
      const isMatch = normalizedValues.some(
        (value) => value === fileNameNormalized || value === fileBaseWithoutExt,
      )
      if (isMatch) {
        found = { row, rowIndex: index }
        break
      }
    }

    if (found) {
      matched.push({ row: found.row, file, rowIndex: found.rowIndex })
      matchedRowIndices.add(found.rowIndex)
    } else {
      unmatchedFiles.push(file)
    }
  }

  const unmatchedRows = rows
    .map((row, index) => ({ row, rowIndex: index }))
    .filter(({ rowIndex }) => !matchedRowIndices.has(rowIndex))

  return { matched, unmatchedFiles, unmatchedRows }
}
