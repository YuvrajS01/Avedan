const STEPS = [
  ['add', 'Add'],
  ['frame', 'Frame'],
  ['ready', 'Ready'],
] as const

export type FlowStepId = (typeof STEPS)[number][0]

export function FlowSteps({ current }: { current: FlowStepId }) {
  const index = STEPS.findIndex(([id]) => id === current)

  return (
    <ol className="flow-steps" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
      {STEPS.map(([id, label], i) => (
        <li
          key={id}
          className={i < index ? 'is-done' : i === index ? 'is-current' : undefined}
          aria-current={i === index ? 'step' : undefined}
        >
          {label}
        </li>
      ))}
    </ol>
  )
}
