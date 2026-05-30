export default function StatCard({
  title,
  value
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">

      <p className="text-gray-500 mb-2">
        {title}
      </p>

      <h3 className="text-3xl font-bold text-gray-800">
        {value}
      </h3>

    </div>
  )
}