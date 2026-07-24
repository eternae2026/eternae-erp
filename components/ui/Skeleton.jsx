export default function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  circle = false,
  className = '',
  style = {}
}) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  const selectedRoundedClass = circle
    ? roundedClasses.full
    : roundedClasses[rounded] || roundedClasses.md

  const resolvedHeight = circle ? width : height

  return (
    <div
      className={`
        animate-pulse
        bg-gray-200
        ${selectedRoundedClass}
        ${className}
      `}
      style={{
        width,
        height: resolvedHeight,
        ...style
      }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({
  lines = 3,
  gap = '0.75rem',
  lastLineWidth = '70%',
  className = ''
}) {
  const safeLines = Math.max(Number(lines) || 1, 1)

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap
      }}
      aria-hidden="true"
    >
      {Array.from(
        { length: safeLines },
        (_, index) => (
          <Skeleton
            key={index}
            width={
              index === safeLines - 1
                ? lastLineWidth
                : '100%'
            }
            height="0.875rem"
          />
        )
      )}
    </div>
  )
}

export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  className = ''
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-gray-200
        bg-white
        p-5
        ${className}
      `}
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton
            width="3rem"
            circle
            className="flex-shrink-0"
          />
        )}

        <div className="min-w-0 flex-1">
          <Skeleton
            width="45%"
            height="1rem"
          />

          <div className="mt-4">
            <SkeletonText
              lines={lines}
              lastLineWidth="60%"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = ''
}) {
  const safeRows = Math.max(Number(rows) || 1, 1)
  const safeColumns = Math.max(Number(columns) || 1, 1)

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
      aria-hidden="true"
    >
      <div
        className="
          grid
          gap-4
          border-b
          border-gray-200
          bg-gray-50
          px-4
          py-3
        "
        style={{
          gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`
        }}
      >
        {Array.from(
          { length: safeColumns },
          (_, index) => (
            <Skeleton
              key={`header-${index}`}
              width="65%"
              height="0.75rem"
            />
          )
        )}
      </div>

      {Array.from(
        { length: safeRows },
        (_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="
              grid
              gap-4
              border-b
              border-gray-100
              px-4
              py-4
              last:border-b-0
            "
            style={{
              gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`
            }}
          >
            {Array.from(
              { length: safeColumns },
              (_, columnIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${columnIndex}`}
                  width={
                    columnIndex === 0
                      ? '75%'
                      : '55%'
                  }
                  height="0.875rem"
                />
              )
            )}
          </div>
        )
      )}
    </div>
  )
}