import Card from '../components/ui/Card.jsx'

function PlaceholderPage({ title, description }) {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {description || 'Halaman ini disiapkan untuk tahap pengembangan berikutnya.'}
        </p>
      </div>

      <Card title={title}>
        <p className="text-sm text-slate-600">
          Fitur frontend untuk halaman ini belum diaktifkan pada tahap sekarang.
        </p>
      </Card>
    </div>
  )
}

export default PlaceholderPage
