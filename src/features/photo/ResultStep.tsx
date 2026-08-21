import type { ProcessedPhoto } from './processPhoto'

interface ResultStepProps {
  result: ProcessedPhoto
  summary: string
  onReset: () => void
}

export function ResultStep({ result, summary, onReset }: ResultStepProps) {
  const allPass = result.checks.every((check) => check.pass)

  return (
    <section className="view" aria-labelledby="result-title">
      <h1 id="result-title">Your photo is ready</h1>
      <p className="lede">
        Target: <strong>{summary}</strong>
      </p>
      <img className="result-preview" src={result.url} alt="Processed photo preview" />
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
      <ul className="check-list" aria-label="Technical checks">
        {result.checks.map((check) => (
          <li key={check.label} className={check.pass ? 'pass' : 'fail'}>
            {check.pass ? '✓' : '✗'} {check.label}
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
