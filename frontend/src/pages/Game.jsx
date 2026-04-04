import { useParams } from 'react-router-dom'

const Game = () => {
  const { roomId } = useParams()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          🎮 Game Room: {roomId}
        </h2>
        <p className="text-gray-400">
          Entire Game Code
        </p>
      </div>
    </div>
  )
}

export default Game