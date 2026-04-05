const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']  // important for Render
})

export default socket