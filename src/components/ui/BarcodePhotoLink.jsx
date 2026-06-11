function BarcodePhotoLink({ url }) {
  if (!url) return '-'

  return (
    <a
      className="inline-flex items-center gap-2 text-sm font-bold text-red-800 hover:text-red-950"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      <img
        alt="Foto struk barcode"
        className="h-10 w-10 rounded border border-slate-200 object-cover"
        src={url}
      />
      Lihat Foto
    </a>
  )
}

export default BarcodePhotoLink
