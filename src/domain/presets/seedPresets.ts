/**
 * Seed preset data (T008/T019/T021).
 *
 * Every entry here is an ILLUSTRATIVE TEMPLATE (D019) — never a claim of
 * official requirements. Real exam/recruitment entries are added only after
 * manual verification by the project owner against official sources.
 *
 * Owner checklist for adding a verified preset (D003/D019):
 * 1. Confirm every value on the authority's official page/notification and
 *    keep that exact page for the record.
 * 2. Set `sourceUrl` to the official page (http(s) URL).
 * 3. Set `lastVerified` to the ISO date (YYYY-MM-DD) you verified it.
 * 4. Record only what is stated: `format`, `pixelSize`, `aspectRatio`,
 *    `physicalSizeMm` + `dpi`, `fileSizeBytes` (min/max/target in bytes),
 *    `background` ('white' only where the form demands a white background).
 *    V3: `thumbImpression` follows the same rules as `photo`/`signature`.
 * 5. Keep `authority` and `name` exactly as the authority names itself.
 * 6. Never guess missing values — omit them instead.
 *
 * The registry validates each entry against the schema at load time and
 * rejects duplicate ids; the Forms UI shows freshness from `lastVerified`.
 * Application kits iterate over whichever of photo/signature/thumbImpression
 * are present — no hardcoding (T021).
 */
export const SEED_PRESETS: unknown[] = [
  {
    id: 'example-exam-413x531',
    name: 'Example exam form (35 × 45 mm)',
    authority: 'Example Authority',
    description:
      'Illustrative template: 413 × 531 px JPG photo within 20–50 KB and a JPG signature within 10–20 KB.',
    lastVerified: '2026-08-01',
    sourceUrl: 'https://example.gov/exam',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 413, height: 531 },
      aspectRatio: { width: 35, height: 45 },
      physicalSizeMm: { width: 35, height: 45 },
      dpi: 300,
      fileSizeBytes: { min: 20 * 1024, max: 50 * 1024 },
    },
    signature: {
      format: 'jpeg',
      fileSizeBytes: { min: 10 * 1024, max: 20 * 1024 },
    },
  },
  {
    id: 'example-university-square',
    name: 'Example university application',
    authority: 'Example University',
    description:
      'Illustrative template: square 300 × 300 px PNG photo up to 100 KB and a PNG signature up to 50 KB.',
    lastVerified: '2026-07-15',
    sourceUrl: 'https://example.edu/apply',
    photo: {
      format: 'png',
      pixelSize: { width: 300, height: 300 },
      aspectRatio: { width: 1, height: 1 },
      fileSizeBytes: { max: 100 * 1024 },
    },
    signature: {
      format: 'png',
      fileSizeBytes: { max: 50 * 1024 },
    },
  },
  {
    id: 'example-recruitment-small',
    name: 'Example recruitment form (small)',
    authority: 'Example Recruitment Board',
    description:
      'Illustrative template: 200 × 260 px JPG photo up to 30 KB and a compact JPG signature.',
    lastVerified: '2025-06-01',
    sourceUrl: 'https://example.gov.in/recruit',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 200, height: 260 },
      aspectRatio: { width: 3, height: 4 },
      fileSizeBytes: { max: 30 * 1024 },
    },
    signature: {
      format: 'jpeg',
      fileSizeBytes: { max: 20 * 1024 },
    },
  },
  {
    id: 'example-white-background',
    name: 'Example form requiring a white background',
    authority: 'Example Authority',
    description:
      'Illustrative template: 350 × 450 px JPG photo up to 100 KB on a plain white background.',
    lastVerified: '2026-08-10',
    sourceUrl: 'https://example.gov/whitebg',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 350, height: 450 },
      aspectRatio: { width: 7, height: 9 },
      fileSizeBytes: { max: 100 * 1024 },
      background: 'white',
    },
  },
  {
    id: 'example-thumb-kit',
    name: 'Example application kit with thumb impression',
    authority: 'Example Authority',
    description:
      'Illustrative template: 350 × 450 px JPG photo (20–50 KB), JPG signature (10–20 KB), and 240 × 240 px JPG left thumb impression (10–30 KB).',
    lastVerified: '2026-08-20',
    sourceUrl: 'https://example.gov/kit',
    photo: {
      format: 'jpeg',
      pixelSize: { width: 350, height: 450 },
      aspectRatio: { width: 7, height: 9 },
      fileSizeBytes: { min: 20 * 1024, max: 50 * 1024 },
      background: 'white',
    },
    signature: {
      format: 'jpeg',
      fileSizeBytes: { min: 10 * 1024, max: 20 * 1024 },
    },
    thumbImpression: {
      format: 'jpeg',
      pixelSize: { width: 240, height: 240 },
      aspectRatio: { width: 1, height: 1 },
      fileSizeBytes: { min: 10 * 1024, max: 30 * 1024 },
    },
  },
]
