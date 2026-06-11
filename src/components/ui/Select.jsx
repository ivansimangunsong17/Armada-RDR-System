function Select({
  children,
  className = '',
  id,
  label,
  name,
  value,
  onChange,
  ...props
}) {
  const selectId = id || name

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          {label}
        </span>
      )}
      <select
        className={[
          'min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-red-700 focus:ring-4 focus:ring-red-100',
          className,
        ].join(' ')}
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export default Select
