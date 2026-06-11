function Input({
  className = '',
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  ...props
}) {
  const inputId = id || name

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          {label}
        </span>
      )}
      <input
        className={[
          'min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-red-700 focus:ring-4 focus:ring-red-100',
          className,
        ].join(' ')}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </label>
  )
}

export default Input
