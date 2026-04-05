import { useState } from 'react'

function GuessInput({ onGuess, onChat, disabled, placeholder }) {
  const [text, setText] = useState('')

  function handleSubmit() {
    if (!text.trim()) return
    onGuess(text.trim())
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || 'Type your guess...'}
        maxLength={50}
        className="flex-1 bg-gray-700 text-white placeholder-gray-400
                   rounded-lg px-4 py-2 outline-none border border-gray-600
                   focus:border-blue-500 transition disabled:opacity-50
                   disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                   disabled:cursor-not-allowed text-white font-semibold
                   px-4 py-2 rounded-lg transition"
      >
        Send
      </button>
    </div>
  )
}

export default GuessInput