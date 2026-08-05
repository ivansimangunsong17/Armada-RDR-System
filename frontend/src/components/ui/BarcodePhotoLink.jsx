function BarcodePhotoLink({ url }) {
  if (!url) return '-'

  return (
    <a
      className="inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-800 hover:border-red-200 hover:bg-red-100 hover:text-red-950"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      Lihat Foto
    </a>
  )
}

export default BarcodePhotoLink