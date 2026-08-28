export interface NamingContext {
  /** Basename without extension, e.g., "rahul" from "rahul.jpg" */
  original: string
  /** 1-based index in batch/kit */
  index: number
  /** Asset kind, e.g., "photo", "signature", "thumbImpression", "thumb" */
  kind: string
  /** Preset id or "manual" */
  preset: string
  /** Extension without dot, e.g., "jpg" */
  ext: string
}

const DEFAULT_TEMPLATE = '{original}-avedan'

/**
 * Sanitize a filename fragment for filesystem safety.
 * Replaces illegal chars (<>:"/\\|?* and control chars 0x00-0x1F) with "_",
 * trims whitespace, and falls back to "file" if empty.
 */
export function sanitizeFileNamePart(value: string): string {
  const sanitized = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim()
  if (!sanitized) return 'file'
  // Avoid names that are just dots or empty after sanitization
  if (/^\.+$/.test(sanitized)) return 'file'
  return sanitized
}

/**
 * Render a file name from a template and context.
 *
 * Supported tokens (case-sensitive):
 *  {original} — sanitized basename
 *  {index}    — 1-based index
 *  {kind}     — asset kind (sanitized, lowercased)
 *  {preset}   — preset id or "manual" (sanitized)
 *  {ext}      — extension without dot (sanitized, lowercased)
 *
 * If template is empty/whitespace, DEFAULT_TEMPLATE is used.
 * If the rendered result does not already end with ".{ext}", the extension
 * is appended. The result is sanitized to avoid illegal chars in the final
 * name (except the single dot before extension is preserved).
 *
 * No eval, no code execution — pure string replacement.
 */
export function renderFileName(template: string, context: NamingContext): string {
  const rawTemplate = template.trim() ? template.trim() : DEFAULT_TEMPLATE
  const original = sanitizeFileNamePart(context.original)
  const preset = sanitizeFileNamePart(context.preset)
  const kind = sanitizeFileNamePart(context.kind.toLowerCase())
  const ext = sanitizeFileNamePart(context.ext.toLowerCase()).replace(/^\.+/, '')

  let rendered = rawTemplate
    .replaceAll('{original}', original)
    .replaceAll('{index}', String(context.index))
    .replaceAll('{kind}', kind)
    .replaceAll('{preset}', preset)
    .replaceAll('{ext}', ext)

  rendered = rendered.trim()
  if (!rendered) rendered = original

  // Remove any illegal chars from the rendered name, but preserve the dot before extension
  // Split into name + ext parts for sanitization
  const lastDot = rendered.lastIndexOf('.')
  let namePart: string
  let extPart: string | null = null
  if (lastDot > 0) {
    namePart = rendered.slice(0, lastDot)
    extPart = rendered.slice(lastDot + 1)
  } else {
    namePart = rendered
  }

  namePart = sanitizeFileNamePart(namePart)
  if (extPart !== null) {
    extPart = sanitizeFileNamePart(extPart).replace(/^\.+/, '')
    if (!extPart) extPart = ext
    rendered = `${namePart}.${extPart}`
  } else {
    // No extension in template — append the context ext
    rendered = `${namePart}.${ext}`
  }

  // Final sanitize: ensure no path separators slipped through, and collapse consecutive dots
  rendered = rendered.replace(/[\\/]/g, '_')
  return rendered
}

/**
 * Deduplicate a list of file names by appending " -2", " -3", etc. before the extension.
 * Preserves the first occurrence, renames subsequent collisions.
 * Example: ["a.jpg", "a.jpg", "a.jpg"] → ["a.jpg", "a-2.jpg", "a-3.jpg"]
 */
export function dedupeFileNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  const result: string[] = []

  for (const original of names) {
    const lower = original.toLowerCase()
    const count = seen.get(lower) ?? 0
    if (count === 0) {
      seen.set(lower, 1)
      result.push(original)
    } else {
      const dotIndex = original.lastIndexOf('.')
      const base = dotIndex > 0 ? original.slice(0, dotIndex) : original
      const ext = dotIndex > 0 ? original.slice(dotIndex) : ''
      const next = `${base}-${count + 1}${ext}`
      // Handle case where generated name also collides (rare)
      let candidate = next
      let attempt = count + 1
      while (seen.has(candidate.toLowerCase())) {
        attempt += 1
        candidate = `${base}-${attempt}${ext}`
      }
      seen.set(lower, attempt)
      seen.set(candidate.toLowerCase(), 1)
      result.push(candidate)
    }
  }

  return result
}

export const NAMING_TEMPLATE_DEFAULT = DEFAULT_TEMPLATE

function getStorage(): Storage | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
    if (typeof globalThis !== 'undefined') {
      const maybe = (globalThis as unknown as { localStorage?: Storage }).localStorage
      if (maybe) return maybe
    }
    // fallback to global localStorage (browser)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = typeof global !== 'undefined' ? global : undefined
    if (g?.localStorage) return g.localStorage
  } catch {
    // ignore
  }
  return undefined
}

export function getNamingTemplate(presetId: string | undefined): string {
  const key = `avedan-naming:${presetId ?? 'manual'}`
  try {
    const storage = getStorage()
    const stored = storage?.getItem(key)
    if (stored !== null && stored !== undefined) return stored
  } catch {
    // ignore (e.g., no localStorage in test)
  }
  return NAMING_TEMPLATE_DEFAULT
}

export function setNamingTemplate(presetId: string | undefined, template: string): void {
  const key = `avedan-naming:${presetId ?? 'manual'}`
  try {
    getStorage()?.setItem(key, template)
  } catch {
    // ignore
  }
}
