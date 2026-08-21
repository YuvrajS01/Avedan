interface PlaceholderViewProps {
  title: string
  description: string
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <section className="view" aria-labelledby="view-title">
      <h1 id="view-title">{title}</h1>
      <div className="card placeholder-card">
        <p>{description}</p>
        <p className="placeholder-status">In progress — not yet available.</p>
      </div>
    </section>
  )
}
