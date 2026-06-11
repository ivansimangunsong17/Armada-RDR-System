const badgeVariants = {
  active: 'bg-red-50 text-red-800 ring-red-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

function Badge({ children, className = '', variant = 'active' }) {
  const variantClass = badgeVariants[variant] || badgeVariants.active

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1',
        variantClass,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}

export default Badge
