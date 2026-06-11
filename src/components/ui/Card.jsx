function Card({ children, className = '', title, subtitle }) {
  return (
    <section
      className={[
        'min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70',
        className,
      ].join(' ')}
    >
      {(title || subtitle) && (
        <div className="mb-4 border-b border-slate-100 pb-4">
          {title && <h2 className="text-lg font-bold text-slate-950">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      )}

      {children}
    </section>
  )
}

export default Card
