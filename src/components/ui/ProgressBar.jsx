function ProgressBar({ className = '', value = 0, showLabel = false }) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100)

  return (
    <div className={['flex items-center gap-3', className].join(' ')}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200">
        <div
          className="h-full rounded-full bg-red-800 transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      {showLabel && (
        <span className="min-w-12 text-right text-sm font-bold text-slate-700">
          {safeValue.toFixed(2)}%
        </span>
      )}
    </div>
  )
}

export default ProgressBar
