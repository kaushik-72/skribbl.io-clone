function Timer({ timeLeft, totalTime }) {
  // calculate color based on time remaining
  const percentage = (timeLeft / totalTime) * 100
  const color =
    percentage > 50
      ? 'text-green-400'
      : percentage > 25
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <div className="flex flex-col items-center">
      <span className={`text-4xl font-bold ${color}`}>
        {timeLeft}
      </span>
      <span className="text-gray-400 text-xs">seconds</span>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${
            percentage > 50
              ? 'bg-green-400'
              : percentage > 25
              ? 'bg-yellow-400'
              : 'bg-red-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default Timer