function ModulePageShell({ title, description, actions, children }) {
  return (
    <section className="module-page">
      <header className="module-header">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        <div>{actions}</div>
      </header>
      <div className="module-body">{children}</div>
    </section>
  )
}

export default ModulePageShell
