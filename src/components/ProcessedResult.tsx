import type { ProcessedAsset } from '../domain/jobs/result'

interface ProcessedResultProps {
  result: ProcessedAsset
  summary: string
  noun: string
  onReset: () => void
}

const STATUS_MARK: Record<string, string> = {
  pass: '✓',
  attention: '!',
  'not-run': '–',
}

export function ProcessedResult({ result, summary, noun, onReset }: ProcessedResultProps) {
  const { validation } = result
  const allPass = validation.status === 'pass'

  return (
    <section className="view" aria-labelledby="result-title">
      <h1 id="result-title">Your {noun} is ready</h1>
      <p className="lede">
        Target: <strong>{summary}</strong>
      </p>
      <img className="result-preview" src={result.url} alt={`Processed ${noun} preview`} />
      <dl className="meta-list">
        <div>
          <dt>Dimensions</dt>
          <dd>
            {result.width} × {result.height} px
          </dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{result.format?.toUpperCase()}</dd>
        </div>
        <div>
          <dt>File size</dt>
          <dd>{(result.sizeBytes / 1024).toFixed(1)} KB</dd>
        </div>
        {result.outcome !== 'ok' && (
          <div>
            <dt>Note</dt>
            <dd>
              {result.outcome === 'too-large'
                ? 'The size limit could not be met at acceptable quality.'
                : 'The minimum size could not be reached naturally.'}
            </dd>
          </div>
        )}
      </dl>
      <p
        className={allPass ? 'validation-banner pass' : 'validation-banner attention'}
        role="status"
      >
        {allPass ? 'Technical checks passed' : 'Attention needed on some checks'}
      </p>
      <ul className="check-list" aria-label="Technical checks">
        {validation.checks.map((check) => (
          <li key={check.id} className={check.status}>
            <span aria-hidden="true">{STATUS_MARK[check.status]}</span>{' '}
            {check.label}
            {check.details && <span className="check-details"> — {check.details}</span>}
          </li>
        ))}
      </ul>
      <p className="privacy-note">
        Technical checks passed does not guarantee acceptance by an authority.
      </p>
      <div className="step-actions">
        <button type="button" className="button button-secondary" onClick={onReset}>
          Start over
        </button>
        <a
          className="button button-primary"
          href={result.url}
          download={result.fileName}
        >
          Download {allPass ? '' : 'anyway'}
        </a>
      </div>
    </section>
  )
}
