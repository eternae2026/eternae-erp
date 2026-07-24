import EmptyState from './EmptyState'
import Loading from './Loading'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  loadingText = 'Carregando registros...',
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = '',
  emptyIcon = null,
  emptyAction = null,
  getRowKey,
  onRowClick,
  className = '',
  tableClassName = '',
  rowClassName = ''
}) {
  function resolveRowKey(row, rowIndex) {
    if (typeof getRowKey === 'function') {
      return getRowKey(row, rowIndex)
    }

    return row?.id ?? rowIndex
  }

  function resolveCellContent(column, row, rowIndex) {
    if (typeof column.render === 'function') {
      return column.render(row, rowIndex)
    }

    if (column.accessor) {
      return row?.[column.accessor]
    }

    return null
  }

  function resolveAlignment(alignment = 'left') {
    const alignments = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }

    return alignments[alignment] || alignments.left
  }

  function resolveVerticalAlignment(alignment = 'middle') {
    const alignments = {
      top: 'align-top',
      middle: 'align-middle',
      bottom: 'align-bottom'
    }

    return alignments[alignment] || alignments.middle
  }

  function handleRowKeyDown(event, row, rowIndex) {
    if (!onRowClick) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row, rowIndex)
    }
  }

  return (
    <div
      className={`
        w-full
        overflow-hidden
        rounded-xl
        border
        border-gray-200
        bg-white
        ${className}
      `}
    >
      <div className="w-full overflow-x-auto">
        <table
          className={`
            w-full
            min-w-full
            border-collapse
            ${tableClassName}
          `}
        >
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={
                    column.id ||
                    column.accessor ||
                    column.label ||
                    columnIndex
                  }
                  scope="col"
                  className={`
                    whitespace-nowrap
                    border-b
                    border-gray-200
                    px-4
                    py-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-500
                    ${resolveAlignment(column.align)}
                    ${column.headerClassName || ''}
                  `}
                  style={
                    column.width
                      ? { width: column.width }
                      : undefined
                  }
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {!loading &&
              data.map((row, rowIndex) => {
                const clickable = Boolean(onRowClick)

                return (
                  <tr
                    key={resolveRowKey(row, rowIndex)}
                    onClick={
                      clickable
                        ? () => onRowClick(row, rowIndex)
                        : undefined
                    }
                    onKeyDown={(event) =>
                      handleRowKeyDown(
                        event,
                        row,
                        rowIndex
                      )
                    }
                    tabIndex={clickable ? 0 : undefined}
                    className={`
                      bg-white
                      transition
                      hover:bg-gray-50
                      ${
                        clickable
                          ? `
                            cursor-pointer
                            focus:bg-gray-50
                            focus:outline-none
                            focus:ring-2
                            focus:ring-inset
                            focus:ring-green-100
                          `
                          : ''
                      }
                      ${
                        typeof rowClassName === 'function'
                          ? rowClassName(row, rowIndex)
                          : rowClassName
                      }
                    `}
                  >
                    {columns.map(
                      (column, columnIndex) => (
                        <td
                          key={
                            column.id ||
                            column.accessor ||
                            `${rowIndex}-${columnIndex}`
                          }
                          className={`
                            px-4
                            py-3
                            text-sm
                            text-gray-700
                            ${resolveAlignment(
                              column.align
                            )}
                            ${resolveVerticalAlignment(
                              column.verticalAlign
                            )}
                            ${column.cellClassName || ''}
                          `}
                        >
                          {resolveCellContent(
                            column,
                            row,
                            rowIndex
                          )}
                        </td>
                      )
                    )}
                  </tr>
                )
              })}

            {loading && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-6 py-12"
                >
                  <Loading text={loadingText} />
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="p-0"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon}
                    action={emptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}