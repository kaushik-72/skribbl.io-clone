const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { getRandomWords } = require('./words')

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

// ─── Helpers ──────────────────────────────────────
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// get word hint — shows blanks like _ p p l e for "apple"
function getHint(word, revealCount = 0) {
  return word
    .split('')
    .map((letter, i) => {
      if (letter === ' ') return ' '
      if (i < revealCount) return letter
      return '_'
    })
    .join(' ')
}

// start the round timer — counts down and ends round automatically
function startRoundTimer(roomId) {
  const room = rooms.get(roomId)
  if (!room) return

  // clear any existing timer first
  if (room.gameState.timer) {
    clearInterval(room.gameState.timer)
  }

  let timeLeft = room.settings.drawTime
  room.gameState.timeLeft = timeLeft

  // emit tick every second
  room.gameState.timer = setInterval(() => {
    const room = rooms.get(roomId)
    if (!room) {
      clearInterval(room?.gameState?.timer)
      return
    }

    timeLeft--
    room.gameState.timeLeft = timeLeft

    // reveal a hint every 20 seconds
    if (timeLeft % 20 === 0 && timeLeft > 0) {
      room.gameState.hintsRevealed = (room.gameState.hintsRevealed || 0) + 1
      const hint = getHint(room.gameState.word, room.gameState.hintsRevealed)
      io.to(roomId).emit('hint_update', { hint })
    }

    // broadcast time left to everyone
    io.to(roomId).emit('timer_tick', { timeLeft })

    // time ran out — end the round
    if (timeLeft <= 0) {
      clearInterval(room.gameState.timer)
      endRound(roomId)
    }
  }, 1000)
}

// end the current round
function endRound(roomId) {
  const room = rooms.get(roomId)
  if (!room) return

  // stop timer
  if (room.gameState.timer) {
    clearInterval(room.gameState.timer)
    room.gameState.timer = null
  }

  const correctWord = room.gameState.word

  // reset who has guessed
  room.players.forEach(p => { p.hasGuessed = false })

  // tell everyone round ended
  io.to(roomId).emit('round_end', {
    word: correctWord,
    scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
  })

  // wait 4 seconds then start next round or end game
  setTimeout(() => {
    const room = rooms.get(roomId)
    if (!room) return

    room.gameState.currentDrawerIndex =
      (room.gameState.currentDrawerIndex + 1) % room.players.length

    // check if all players had a turn in this round
    if (room.gameState.currentDrawerIndex === 0) {
      room.gameState.round++
    }

    // check if game is over
    if (room.gameState.round >= room.settings.rounds) {
      endGame(roomId)
      return
    }

    startNextTurn(roomId)
  }, 4000)
}

// start the next turn
function startNextTurn(roomId) {
  const room = rooms.get(roomId)
  if (!room) return

  const drawerIndex = room.gameState.currentDrawerIndex
  const drawer = room.players[drawerIndex]

  if (!drawer) return

  // reset game state for new turn
  room.gameState.drawerId = drawer.id
  room.gameState.word = null
  room.gameState.hintsRevealed = 0
  room.gameState.guessedCount = 0

  const wordOptions = getRandomWords(3)
  room.gameState.wordOptions = wordOptions

  // tell drawer their word choices
  io.to(drawer.id).emit('choose_word', {
    words: wordOptions,
    drawerId: drawer.id
  })

  // tell everyone else who is drawing
  io.to(roomId).emit('turn_start', {
    drawerId: drawer.id,
    drawerName: drawer.name,
    round: room.gameState.round + 1,
    totalRounds: room.settings.rounds
  })

  console.log(`🎨 ${drawer.name}'s turn in room ${roomId}`)
}

// end the entire game
function endGame(roomId) {
  const room = rooms.get(roomId)
  if (!room) return

  // sort players by score descending
  const leaderboard = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      score: p.score
    }))

  io.to(roomId).emit('game_over', {
    winner: leaderboard[0],
    leaderboard
  })

  // reset game state so they can play again
  room.gameState.started = false
  room.gameState.round = 0
  room.gameState.drawerId = null
  room.gameState.word = null
  room.players.forEach(p => { p.score = 0 })

  console.log(`🏆 Game over in room ${roomId}, winner: ${leaderboard[0]?.name}`)
}


io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`)

  // CREATE ROOM
  socket.on('create_room', ({ playerName, settings }) => {
    const roomId = generateRoomId()

    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      isHost: true,
      hasGuessed: false
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
        currentDrawerIndex: 0,
        drawerId: null,
        word: null,
        wordOptions: [],
        hintsRevealed: 0,
        guessedCount: 0,
        timeLeft: 0,
        timer: null
      }
    }

    rooms.set(roomId, room)
    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.playerName = playerName

    socket.emit('room_created', { roomId, room })
    console.log(`🏠 Room ${roomId} created by ${playerName}`)
  })

  // JOIN ROOM
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
      isHost: false,
      hasGuessed: false
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

  // START GAME
  socket.on('start_game', ({ roomId }) => {
    const room = rooms.get(roomId)

    if (!room) return
    if (room.host !== socket.id) return
    if (room.players.length < 2) return

    room.gameState.started = true
    room.gameState.round = 0
    room.gameState.currentDrawerIndex = 0

    io.to(roomId).emit('game_started')
    console.log(`🎮 Game started in room ${roomId}`)

    // small delay then start first turn
    setTimeout(() => startNextTurn(roomId), 1000)
  })

  // WORD CHOSEN 
  socket.on('word_chosen', ({ roomId, word }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.gameState.drawerId !== socket.id) return

    room.gameState.word = word

    // tell everyone the word length as blanks
    const hint = getHint(word)
    io.to(roomId).emit('word_hint', {
      hint,
      wordLength: word.length
    })

    // tell drawer the actual word
    socket.emit('word_confirmed', { word })

    // start the countdown
    startRoundTimer(roomId)

    console.log(`📝 Word chosen in room ${roomId}: ${word}`)
  })

  // DRAWING EVENTS 
  socket.on('draw_start', ({ roomId, x, y, color, size }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.gameState.drawerId !== socket.id) return

    // broadcast to everyone EXCEPT the drawer
    socket.to(roomId).emit('draw_start', { x, y, color, size })
  })

  socket.on('draw_move', ({ roomId, x, y }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.gameState.drawerId !== socket.id) return

    socket.to(roomId).emit('draw_move', { x, y })
  })

  socket.on('draw_end', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return

    socket.to(roomId).emit('draw_end')
  })

  socket.on('canvas_clear', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.gameState.drawerId !== socket.id) return

    io.to(roomId).emit('canvas_clear')
  })

  socket.on('draw_undo', ({ roomId, canvasData }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (room.gameState.drawerId !== socket.id) return

    socket.to(roomId).emit('draw_undo', { canvasData })
  })

  // GUESS 
  socket.on('guess', ({ roomId, text }) => {
    const room = rooms.get(roomId)
    if (!room) return
    if (!room.gameState.word) return

    // drawer cannot guess
    if (socket.id === room.gameState.drawerId) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player) return

    // already guessed correctly this round
    if (player.hasGuessed) return

    const isCorrect =
      text.trim().toLowerCase() === room.gameState.word.toLowerCase()

    if (isCorrect) {
      player.hasGuessed = true
      room.gameState.guessedCount++

      // points based on how many have already guessed
      // first correct guess gets most points
      const basePoints = 100
      const bonus = Math.max(0, 3 - room.gameState.guessedCount) * 20
      const points = basePoints + bonus
      player.score += points

      // also give drawer points
      const drawer = room.players.find(p => p.id === room.gameState.drawerId)
      if (drawer) drawer.score += 30

      // tell everyone someone guessed correctly
      io.to(roomId).emit('player_guessed', {
        playerId: socket.id,
        playerName: player.name,
        points,
        scores: room.players.map(p => ({
          id: p.id,
          name: p.name,
          score: p.score
        }))
      })

      // check if everyone has guessed — end round early
      const nonDrawers = room.players.filter(
        p => p.id !== room.gameState.drawerId
      )
      const allGuessed = nonDrawers.every(p => p.hasGuessed)

      if (allGuessed) {
        clearInterval(room.gameState.timer)
        endRound(roomId)
      }
    } else {
      // wrong guess — show in chat as normal message
      io.to(roomId).emit('chat_message', {
        playerId: socket.id,
        playerName: player.name,
        text,
        isGuess: true
      })
    }
  })

  // CHAT
  socket.on('chat', ({ roomId, text }) => {
    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.id === socket.id)
    if (!player) return

    io.to(roomId).emit('chat_message', {
      playerId: socket.id,
      playerName: player.name,
      text,
      isGuess: false
    })
  })

  // DISCONNECT
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const leavingPlayer = room.players.find(p => p.id === socket.id)
    room.players = room.players.filter(p => p.id !== socket.id)

    console.log(`❌ ${leavingPlayer?.name} left room ${roomId}`)

    if (room.players.length === 0) {
      if (room.gameState.timer) clearInterval(room.gameState.timer)
      rooms.delete(roomId)
      console.log(`🗑️ Room ${roomId} deleted`)
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

    // if drawer left, end round
    if (
      room.gameState.started &&
      room.gameState.drawerId === socket.id
    ) {
      if (room.gameState.timer) clearInterval(room.gameState.timer)
      endRound(roomId)
    }
  })
})

server.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001')
})