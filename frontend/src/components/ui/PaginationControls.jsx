import Button from './Button.jsx'

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage])

  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)
  if (currentPage <= 3) pages.add(2)
  if (currentPage >= totalPages - 2) pages.add(totalPages - 1)

  const sortedPages = Array.from(pages).sort((a, b) => a - b)
  const items = []

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`)
    }

    items.push(page)
  })

  return items
}

function PaginationControls({ currentPage, disabled = false, onPageChange, totalPages }) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1)
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages)
  const pageItems = getPageItems(safeCurrentPage, safeTotalPages)

  function goToPage(page) {
    if (disabled || page < 1 || page > safeTotalPages || page === safeCurrentPage) return
    onPageChange(page)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={disabled || safeCurrentPage <= 1}
      >
        Prev
      </Button>

      <div className="flex flex-wrap items-center gap-1">
        {pageItems.map((item) =>
          typeof item === 'number' ? (
            <Button
              key={item}
              type="button"
              variant={item === safeCurrentPage ? 'success' : 'secondary'}
              className="min-w-10 px-3"
              onClick={() => goToPage(item)}
              disabled={disabled || item === safeCurrentPage}
            >
              {item}
            </Button>
          ) : (
            <span key={item} className="px-2 text-sm font-bold text-slate-400">
              ...
            </span>
          ),
        )}
      </div>

      <span className="rounded-md border border-slate-200 bg-white px-3 py-2 font-bold text-slate-800">
        Page {safeCurrentPage} / {safeTotalPages}
      </span>

      <Button
        type="button"
        variant="secondary"
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={disabled || safeCurrentPage >= safeTotalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default PaginationControls