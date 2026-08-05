import Input from './Input.jsx'
import { formatTimeInputValue, normalizeTimeInput } from '../../utils/gateTimes.js'

function TimeInput({ disabled = false, label, onChange, value }) {
  function handleChange(event) {
    onChange(formatTimeInputValue(event.target.value))
  }

  function handleBlur() {
    const normalizedTime = normalizeTimeInput(value)

    if (normalizedTime) {
      onChange(normalizedTime)
    }
  }

  return (
    <div>
      <Input
        disabled={disabled}
        inputMode="numeric"
        label={label}
        maxLength={5}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder="08:00"
        value={value}
      />
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Gunakan format 24 jam, contoh 08:00, 16:00, 23:59.
      </p>
    </div>
  )
}

export default TimeInput