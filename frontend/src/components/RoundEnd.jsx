function RoundEnd({ word, scores }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center
                    justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-white text-xl font-bold mb-1">Round Over!</h2>
        <p className="text-gray-400 text-sm mb-2">The word was:</p>
        <p className="text-yellow-400 text-3xl font-bold mb-6 capitalize">
          {word}
        </p>

        <div className="text-left">
          <h3 className="text-gray-300 text-sm font-semibold mb-2 uppercase tracking-wider">
            Scores
          </h3>
          <ul className="space-y-2">
            {[...scores]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between
                             bg-gray-700 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-4">
                      {i + 1}.
                    </span>
                    <span className="text-white text-sm">{p.name}</span>
                  </div>
                  <span className="text-yellow-400 font-bold text-sm">
                    {p.score} pts
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          Next round starting soon...
        </p>
      </div>
    </div>
  )
}

export default RoundEnd