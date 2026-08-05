function Table({
  columns = [],
  data = [],
  className = '',
  emptyMessage = 'Data belum tersedia.',
  tableClassName = '',
}) {
  return (
    <div
      className={[
        'w-full max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60',
        className,
      ].join(' ')}
    >
      <table
        className={['w-full min-w-[960px] border-collapse text-left text-sm', tableClassName].join(
          ' ',
        )}
      >
        <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-extrabold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={columns.length || 1}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-red-50/40">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
