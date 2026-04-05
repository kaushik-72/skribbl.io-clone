function WordSelection({ words, onChoose, isDrawer, drawerName }) {
  // non-drawers see a waiting screen
  if (!isDrawer) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center
                      justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
          <div className="text-5xl mb-4">✏️</div>
          <h2 className="text-white text-xl font-bold mb-2">
            {drawerName} is choosing a word...
          </h2>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                 style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                 style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                 style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // drawer sees word choices
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center
                    justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="text-5xl mb-4">🎨</div>
        <h2 className="text-white text-xl font-bold mb-2">
          Choose a word to draw!
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Pick one — others will try to guess it
        </p>
        <div className="flex flex-col gap-3">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onChoose(word)}
              className="bg-blue-600 hover:bg-blue-500 text-white 
                         font-semibold py-3 px-6 rounded-xl transition
                         text-lg capitalize"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WordSelection