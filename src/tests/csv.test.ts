import { describe, expect, it } from 'vitest'
import { parseCSV, matchDatasetToFiles } from '../domain/dataset/csv'

describe('parseCSV (T028)', () => {
  it('parses headers and rows, trims and lowercases headers', () => {
    const csv = 'id,name,photo\n1,Rahul,rahul.jpg\n2,Anita,anita.jpg'
    const parsed = parseCSV(csv)
    expect(parsed.headers).toEqual(['id', 'name', 'photo'])
    expect(parsed.rows).toEqual([
      { id: '1', name: 'Rahul', photo: 'rahul.jpg' },
      { id: '2', name: 'Anita', photo: 'anita.jpg' },
    ])
  })

  it('handles quoted fields with commas and escaped quotes', () => {
    const csv = 'id,name,photo\n1,"Rahul, Jr","rahul, jr.jpg"\n2,"Anita ""Annie""","anita.jpg"'
    const parsed = parseCSV(csv)
    expect(parsed.rows[0]).toEqual({ id: '1', name: 'Rahul, Jr', photo: 'rahul, jr.jpg' })
    expect(parsed.rows[1]).toEqual({ id: '2', name: 'Anita "Annie"', photo: 'anita.jpg' })
  })

  it('skips empty lines and handles extra columns', () => {
    const csv = 'id,name\n1,Rahul\n\n2,Anita,extra\n,,\n'
    const parsed = parseCSV(csv)
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0]).toEqual({ id: '1', name: 'Rahul' })
    expect(parsed.rows[1]).toEqual({ id: '2', name: 'Anita', _extra_2: 'extra' })
  })

  it('returns empty for empty or header-only CSV', () => {
    expect(parseCSV('')).toEqual({ headers: [], rows: [] })
    expect(parseCSV('id,name\n')).toEqual({ headers: ['id', 'name'], rows: [] })
  })
})

describe('matchDatasetToFiles (T028)', () => {
  it('matches files to rows by filename case-insensitive', () => {
    const rows = [
      { id: '1', name: 'Rahul', photo: 'rahul.jpg' },
      { id: '2', name: 'Anita', photo: 'ANITA.JPG' },
    ]
    const files = [
      new File(['a'], 'Rahul.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'anita.jpg', { type: 'image/jpeg' }),
    ]
    const result = matchDatasetToFiles(files, rows)
    expect(result.matched).toHaveLength(2)
    expect(result.unmatchedFiles).toHaveLength(0)
    expect(result.unmatchedRows).toHaveLength(0)
  })

  it('reports unmatched files and rows', () => {
    const rows = [{ id: '1', name: 'Rahul', photo: 'rahul.jpg' }]
    const files = [
      new File(['a'], 'rahul.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'extra.jpg', { type: 'image/jpeg' }),
    ]
    const result = matchDatasetToFiles(files, rows)
    expect(result.matched).toHaveLength(1)
    expect(result.unmatchedFiles).toHaveLength(1)
    expect(result.unmatchedFiles[0].name).toBe('extra.jpg')
    expect(result.unmatchedRows).toHaveLength(0)

    const files2: File[] = []
    const result2 = matchDatasetToFiles(files2, rows)
    expect(result2.matched).toHaveLength(0)
    expect(result2.unmatchedRows).toHaveLength(1)
  })

  it('matches by basename without extension as fallback', () => {
    const rows = [{ id: '1', photo: 'rahul' }]
    const files = [new File(['a'], 'rahul.jpg', { type: 'image/jpeg' })]
    const result = matchDatasetToFiles(files, rows)
    expect(result.matched).toHaveLength(1)
  })

  it('handles duplicate filenames gracefully (first row wins)', () => {
    const rows = [
      { id: '1', photo: 'a.jpg' },
      { id: '2', photo: 'a.jpg' },
    ]
    const files = [new File(['x'], 'a.jpg', { type: 'image/jpeg' })]
    const result = matchDatasetToFiles(files, rows)
    expect(result.matched).toHaveLength(1)
    expect(result.matched[0].rowIndex).toBe(0)
    expect(result.unmatchedRows).toHaveLength(1)
  })
})
