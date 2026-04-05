function PlayerList({ players, drawerId, currentPlayerId }) {
  // sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="bg-gray-800 rounded-xl p-4 h-full">
      <h3 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wider">
        Players
      </h3>
      <ul className="space-y-2">
        {sorted.map((player) => (
          <li
            key={player.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 
              ${player.id === currentPlayerId ? 'bg-blue-900/40' : 'bg-gray-700'}`}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center
                            justify-center text-white font-bold text-xs flex-shrink-0">
              {player.name[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white text-sm font-medium truncate">
                  {player.name}
                </span>
                {player.id === drawerId && (
                  <span className="text-xs">✏️</span>
                )}
                {player.hasGuessed && (
                  <span className="text-xs">✅</span>
                )}
              </div>
              <span className="text-yellow-400 text-xs font-bold">
                {player.score} pts
              </span>
            </div>

            {player.id === currentPlayerId && (
              <span className="text-xs text-blue-400">You</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerList