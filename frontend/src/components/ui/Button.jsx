const buttonVariants = {
  primary: 'bg-red-800 text-white shadow-sm hover:bg-red-900 focus:ring-red-200',
  secondary: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-100 focus:ring-slate-200',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-200',
  success: 'bg-slate-800 text-white shadow-sm hover:bg-slate-900 focus:ring-slate-300',
}

function Button({
  children,
  className = '',
  type = 'button',
  variant = 'primary',
  disabled = false,
  ...props
}) {
  const variantClass = buttonVariants[variant] || buttonVariants.primary

  return (
    <button
      className={[
        'inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        variantClass,
        className,
      ].join(' ')}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
