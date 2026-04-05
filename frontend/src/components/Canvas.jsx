import { useEffect, useRef, useState } from 'react'
import socket from '../socket'

function Canvas({ roomId, isDrawer }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const strokesHistory = useRef([]) // for undo
  const currentStroke = useRef([])

  const [color, setColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [tool, setTool] = useState('pen') // pen or eraser

  const colors = [
    '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
    '#000000', '#6b7280', '#854d0e', '#164e63'
  ]

  // ── Listen for drawing events from server ──────────
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    socket.on('draw_start', ({ x, y, color, size }) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(x * canvas.width, y * canvas.height)
      lastPos.current = { x: x * canvas.width, y: y * canvas.height }
    })

    socket.on('draw_move', ({ x, y }) => {
      const px = x * canvas.width
      const py = y * canvas.height
      ctx.lineTo(px, py)
      ctx.stroke()
      lastPos.current = { x: px, y: py }
    })

    socket.on('draw_end', () => {
      ctx.closePath()
    })

    socket.on('canvas_clear', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      strokesHistory.current = []
    })

    socket.on('draw_undo', ({ canvasData }) => {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = canvasData
    })

    return () => {
      socket.off('draw_start')
      socket.off('draw_move')
      socket.off('draw_end')
      socket.off('canvas_clear')
      socket.off('draw_undo')
    }
  }, [])

  // ── Get canvas coordinates from mouse/touch event ──
  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top) / canvas.height
    }
  }

  // ── Mouse/Touch handlers (only for drawer) ─────────
  function startDrawing(e) {
    if (!isDrawer) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    const actualColor = tool === 'eraser' ? '#1f2937' : color
    const actualSize = tool === 'eraser' ? brushSize * 4 : brushSize

    isDrawing.current = true
    currentStroke.current = []

    ctx.beginPath()
    ctx.strokeStyle = actualColor
    ctx.lineWidth = actualSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(pos.x * canvas.width, pos.y * canvas.height)

    socket.emit('draw_start', {
      roomId,
      x: pos.x,
      y: pos.y,
      color: actualColor,
      size: actualSize
    })
  }

  function draw(e) {
    if (!isDrawer || !isDrawing.current) return
    e.preventDefault()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)

    ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height)
    ctx.stroke()

    socket.emit('draw_move', { roomId, x: pos.x, y: pos.y })
    currentStroke.current.push(pos)
  }

  function stopDrawing(e) {
    if (!isDrawer || !isDrawing.current) return

    isDrawing.current = false
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.closePath()

    // save snapshot for undo
    strokesHistory.current.push(canvas.toDataURL())

    socket.emit('draw_end', { roomId })
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokesHistory.current = []
    socket.emit('canvas_clear', { roomId })
  }

  function handleUndo() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    strokesHistory.current.pop() // remove current
    const prev = strokesHistory.current[strokesHistory.current.length - 1]

    if (prev) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = prev
      socket.emit('draw_undo', { roomId, canvasData: prev })
    } else {
      // nothing left to undo — clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      socket.emit('canvas_clear', { roomId })
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className={`bg-gray-700 rounded-xl w-full touch-none
            ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Overlay when not drawer */}
        {!isDrawer && (
          <div className="absolute inset-0 rounded-xl" />
        )}
      </div>

      {/* Drawing Tools — only show for drawer */}
      {isDrawer && (
        <div className="bg-gray-800 rounded-xl p-3 flex flex-wrap
                        items-center gap-3">

          {/* Colors */}
          <div className="flex flex-wrap gap-1.5">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen') }}
                className={`w-6 h-6 rounded-full border-2 transition
                  ${color === c && tool === 'pen'
                    ? 'border-white scale-125'
                    : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-600" />

          {/* Brush sizes */}
          <div className="flex items-center gap-2">
            {[2, 4, 8, 14].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`rounded-full bg-white transition
                  ${brushSize === size
                    ? 'ring-2 ring-blue-400'
                    : 'opacity-60'}`}
                style={{ width: size * 2 + 8, height: size * 2 + 8 }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-600" />

          {/* Tools */}
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition
              ${tool === 'eraser'
                ? 'bg-white text-gray-900'
                : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          >
            🧹 Eraser
          </button>

          <button
            onClick={handleUndo}
            className="px-3 py-1 rounded-lg text-sm font-medium
                       bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            ↩️ Undo
          </button>

          <button
            onClick={handleClear}
            className="px-3 py-1 rounded-lg text-sm font-medium
                       bg-red-800 text-white hover:bg-red-700 transition"
          >
            🗑️ Clear
          </button>

        </div>
      )}
    </div>
  )
}

export default Canvas