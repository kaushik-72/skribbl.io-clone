import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'

function Home() {
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      socket.off('room_created')
      socket.off('room_joined')
      socket.off('join_error')
    }
  }, [])

  function handleCreateRoom() {
    if (!playerName.trim()) {
      setError('Please enter your name!')
      return
    }
    setError('')
    setLoading(true)

    socket.connect()

    socket.emit('create_room', {
      playerName: playerName.trim(),
      settings: { rounds: 3, drawTime: 80, maxPlayers: 8 }
    })

    socket.on('room_created', ({ roomId, room }) => {
      sessionStorage.setItem('playerName', playerName.trim())
      setLoading(false)
      navigate(`/lobby/${roomId}`, { state: { room } })
    })
  }

  function handleJoinRoom() {
    if (!playerName.trim()) {
      setError('Please enter your name!')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code!')
      return
    }
    setError('')
    setLoading(true)

    socket.connect()

    socket.emit('join_room', {
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim()
    })

    socket.on('room_joined', ({ roomId, room }) => {
      sessionStorage.setItem('playerName', playerName.trim())
      setLoading(false)
      navigate(`/lobby/${roomId}`, { state: { room } })
    })

    socket.on('join_error', ({ message }) => {
      setError(message)
      setLoading(false)
      socket.disconnect()
    })
  }

  // allow pressing Enter key to submit
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (roomCode) {
        handleJoinRoom()
      } else {
        handleCreateRoom()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 w-full max-w-md">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Skribbl Clone
          </h1>
          <p className="text-gray-400 text-sm">Draw. Guess. Win.</p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className="w-full bg-gray-700 text-white placeholder-gray-400
                       rounded-lg px-4 py-3 outline-none border border-gray-600
                       focus:border-blue-500 transition"
          />
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900
                     disabled:cursor-not-allowed text-white font-semibold 
                     py-3 rounded-lg transition mb-4"
        >
          {loading ? 'Connecting...' : '🏠 Create Room'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <hr className="flex-1 border-gray-600" />
          <span className="text-gray-500 text-sm">or join existing</span>
          <hr className="flex-1 border-gray-600" />
        </div>

        {/* Join Room Input */}
        <input
          type="text"
          placeholder="Room code (e.g. A3KZ92)"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={6}
          className="w-full bg-gray-700 text-white placeholder-gray-400
                     rounded-lg px-4 py-3 outline-none border border-gray-600
                     focus:border-green-500 transition mb-3"
        />

        {/* Join Room Button */}
        <button
          onClick={handleJoinRoom}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900
                     disabled:cursor-not-allowed text-white font-semibold 
                     py-3 rounded-lg transition"
        >
          {loading ? 'Joining...' : '🚪 Join Room'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500
                          text-red-300 rounded-lg px-4 py-3 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

      </div>
    </div>
  )
}

export default Home