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
      <div className="result-head">
        <span
          className={allPass ? 'result-status-icon pass' : 'result-status-icon attention'}
          aria-hidden="true"
        >
          {allPass ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 6v7" />
              <path d="M12 17h.01" />
            </svg>
          )}
        </span>
        <h1 id="result-title">Your {noun} is ready</h1>
      </div>
      <p className="lede">
        Target: <strong>{summary}</strong>
      </p>
      <div className="result-layout">
        <figure className="result-figure">
          <img className="result-preview" src={result.url} alt={`Processed ${noun} preview`} />
        </figure>
        <div>
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
            <span aria-hidden="true">{allPass ? '✓' : '!'}</span>
            {allPass ? 'Technical checks passed' : 'Attention needed on some checks'}
          </p>
          <ul className="check-list" aria-label="Technical checks">
            {validation.checks.map((check) => (
              <li key={check.id} className={check.status}>
                <span className="check-mark" aria-hidden="true">
                  {STATUS_MARK[check.status]}
                </span>
                <span>
                  {check.label}
                  {check.details && <span className="check-details"> — {check.details}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="privacy-note">
            Technical checks passed does not guarantee acceptance by an authority.
          </p>
        </div>
      </div>
      <div className="step-actions">
        <button type="button" className="button button-secondary" onClick={onReset}>
          Make another
        </button>
        <a
          className="button button-primary button-large"
          href={result.url}
          download={result.fileName}
        >
          Download {noun}
          {allPass ? '' : ' anyway'}
        </a>
      </div>
    </section>
  )
}
