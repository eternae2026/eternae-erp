export default function StatCard({
  title,
  value
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-40 flex flex-col">

      <div className="min-h-[48px]">
        <p className="text-gray-500 text-sm leading-5">
          {title}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <h3 className="text-[2rem] font-bold text-gray-800 text-center leading-none whitespace-nowrap">
  {value}
</h3>
      </div>

    </div>
  )
}