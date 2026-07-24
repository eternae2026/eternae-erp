export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showPageNumbers = true,
  previousLabel = 'Anterior',
  nextLabel = 'Próxima',
  disabled = false,
  className = ''
}) {
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1)
  const safeCurrentPage = Math.min(
    Math.max(Number(currentPage) || 1, 1),
    safeTotalPages
  )

  function changePage(page) {
    if (disabled) {
      return
    }

    if (page < 1 || page > safeTotalPages) {
      return
    }

    if (page === safeCurrentPage) {
      return
    }

    onPageChange?.(page)
  }

  function createPageRange() {
    if (!showPageNumbers) {
      return []
    }

    const totalVisiblePages = siblingCount * 2 + 5

    if (safeTotalPages <= totalVisiblePages) {
      return Array.from(
        { length: safeTotalPages },
        (_, index) => index + 1
      )
    }

    const leftSibling = Math.max(
      safeCurrentPage - siblingCount,
      1
    )

    const rightSibling = Math.min(
      safeCurrentPage + siblingCount,
      safeTotalPages
    )

    const showLeftEllipsis = leftSibling > 2
    const showRightEllipsis =
      rightSibling < safeTotalPages - 1

    const pages = [1]

    if (showLeftEllipsis) {
      pages.push('left-ellipsis')
    } else {
      for (let page = 2; page < leftSibling; page += 1) {
        pages.push(page)
      }
    }

    for (
      let page = leftSibling;
      page <= rightSibling;
      page += 1
    ) {
      if (page !== 1 && page !== safeTotalPages) {
        pages.push(page)
      }
    }

    if (showRightEllipsis) {
      pages.push('right-ellipsis')
    } else {
      for (
        let page = rightSibling + 1;
        page < safeTotalPages;
        page += 1
      ) {
        pages.push(page)
      }
    }

    if (safeTotalPages > 1) {
      pages.push(safeTotalPages)
    }

    return pages
  }

  const pages = createPageRange()

  const baseButtonClasses = `
    inline-flex
    h-9
    min-w-9
    items-center
    justify-center
    rounded-lg
    border
    px-3
    text-sm
    font-medium
    transition
    focus:outline-none
    focus:ring-2
    focus:ring-green-100
    disabled:cursor-not-allowed
    disabled:opacity-50
  `

  return (
    <nav
      className={`
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
        ${className}
      `}
      aria-label="Paginação"
    >
      <p className="text-sm text-gray-500">
        Página{' '}
        <span className="font-semibold text-gray-700">
          {safeCurrentPage}
        </span>{' '}
        de{' '}
        <span className="font-semibold text-gray-700">
          {safeTotalPages}
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => changePage(safeCurrentPage - 1)}
          disabled={disabled || safeCurrentPage === 1}
          className={`
            ${baseButtonClasses}
            border-gray-200
            bg-white
            text-gray-600
            hover:bg-gray-50
            hover:text-gray-900
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          {previousLabel}
        </button>

        {pages.map((page) => {
          const isEllipsis =
            page === 'left-ellipsis' ||
            page === 'right-ellipsis'

          if (isEllipsis) {
            return (
              <span
                key={page}
                className="
                  inline-flex
                  h-9
                  min-w-9
                  items-center
                  justify-center
                  px-2
                  text-sm
                  text-gray-400
                "
                aria-hidden="true"
              >
                …
              </span>
            )
          }

          const isCurrentPage = page === safeCurrentPage

          return (
            <button
              key={page}
              type="button"
              onClick={() => changePage(page)}
              disabled={disabled}
              aria-current={
                isCurrentPage ? 'page' : undefined
              }
              aria-label={`Ir para a página ${page}`}
              className={`
                ${baseButtonClasses}
                ${
                  isCurrentPage
                    ? `
                      border-green-600
                      bg-green-600
                      text-white
                    `
                    : `
                      border-gray-200
                      bg-white
                      text-gray-600
                      hover:bg-gray-50
                      hover:text-gray-900
                    `
                }
              `}
            >
              {page}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => changePage(safeCurrentPage + 1)}
          disabled={
            disabled ||
            safeCurrentPage === safeTotalPages
          }
          className={`
            ${baseButtonClasses}
            border-gray-200
            bg-white
            text-gray-600
            hover:bg-gray-50
            hover:text-gray-900
          `}
        >
          {nextLabel}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </nav>
  )
}