  function Modal({ children, isOpen, onClose, title }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/75 p-4">
      <div className="my-6 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl ring-1 ring-slate-950/10">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            aria-label="Tutup modal"
            className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
