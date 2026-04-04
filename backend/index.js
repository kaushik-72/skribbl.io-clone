const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// ─── In-memory store ──────────────────────────────
const rooms = new Map()

// ─── Helper ───────────────────────────────────────
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Socket Events ────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`)

  // -------- CREATE ROOM --------
  socket.on('create_room', ({ playerName, settings }) => {
    const roomId = generateRoomId()

    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: true
    }

    const room = {
      id: roomId,
      host: socket.id,
      players: [player],
      settings: {
        maxPlayers: settings?.maxPlayers || 8,
        rounds: settings?.rounds || 3,
        drawTime: settings?.drawTime || 80
      },
      gameState: {
        started: false,
        round: 0,
        drawerId: null,
        word: null
      }
    }

    rooms.set(roomId, room)
    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    socket.emit('room_created', { roomId, room })
    console.log(`🏠 Room ${roomId} created by ${playerName}`)
  })

  // -------- JOIN ROOM --------
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId)

    if (!room) {
      socket.emit('join_error', { message: 'Room not found. Check the code!' })
      return
    }
    if (room.gameState.started) {
      socket.emit('join_error', { message: 'Game already started!' })
      return
    }
    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('join_error', { message: 'Room is full!' })
      return
    }

    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: false
    }

    room.players.push(player)
    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    socket.emit('room_joined', { roomId, room })
    socket.to(roomId).emit('player_joined', {
      player,
      players: room.players
    })

    console.log(`👤 ${playerName} joined room ${roomId}`)
  })

  // -------- START GAME --------
  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId)

    if (!room) return
    if (room.host !== socket.id) return
    if (room.players.length < 2) return

    room.gameState.started = true
    io.to(roomId).emit('game_started')
    console.log(`🎮 Game started in room ${roomId}`)
  })

  // -------- DISCONNECT --------
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const leavingPlayer = room.players.find(p => p.id === socket.id)
    room.players = room.players.filter(p => p.id !== socket.id)

    console.log(`❌ ${leavingPlayer?.name} left room ${roomId}`)

    if (room.players.length === 0) {
      rooms.delete(roomId)
      console.log(`🗑️ Room ${roomId} deleted (empty)`)
      return
    }

    if (room.host === socket.id) {
      room.host = room.players[0].id
      room.players[0].isHost = true
      io.to(roomId).emit('host_changed', {
        newHostId: room.host,
        players: room.players
      })
    }

    io.to(roomId).emit('player_left', {
      playerId: socket.id,
      players: room.players
    })
  })
})

// ─── Start Server ─────────────────────────────────
server.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001')
})