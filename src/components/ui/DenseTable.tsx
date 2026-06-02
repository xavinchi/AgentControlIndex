import type { ReactNode } from 'react'

type DenseTableProps = {
  headers: string[]
  rows: Array<Array<ReactNode>>
  className?: string
}

export default function DenseTable({ headers, rows, className = '' }: DenseTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="dense-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, colIndex) => (
                <td key={`cell-${rowIndex}-${colIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
