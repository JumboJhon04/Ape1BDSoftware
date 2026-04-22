function TableCardPlaceholder({ columns }) {
  return (
    <div className="table-card">
      <div className="table-head">
        {columns.map((column) => (
          <div key={column} className="table-head-cell">
            {column}
          </div>
        ))}
      </div>
      <div className="table-body">
        {[1, 2, 3, 4].map((row) => (
          <div className="table-row" key={row}>
            {columns.map((column) => (
              <div key={`${column}-${row}`} className="table-cell-skeleton" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableCardPlaceholder
