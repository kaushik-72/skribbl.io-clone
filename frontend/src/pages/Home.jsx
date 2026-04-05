import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const GAME_MODES = [
  {
    id: "quick",
    label: "⚡ Quick Game",
    description: "1 min rounds • 2 words each",
    settings: { rounds: 2, drawTime: 60, maxPlayers: 8 },
  },
  {
    id: "battle",
    label: "⚔️ Battle",
    description: "3 min rounds • 3 words each",
    settings: { rounds: 3, drawTime: 180, maxPlayers: 8 },
  },
  {
    id: "championship",
    label: "🏆 Championship",
    description: "5 min rounds • 4 words each",
    settings: { rounds: 4, drawTime: 300, maxPlayers: 8 },
  },
  {
    id: "custom",
    label: "⚙️ Custom",
    description: "Set your own rules",
    settings: null,
  },
];

function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("battle");
  const [showCustom, setShowCustom] = useState(false);
  const [customRounds, setCustomRounds] = useState(3);
  const [customDrawTime, setCustomDrawTime] = useState(80);
  const navigate = useNavigate();

  useEffect(() => {
    setShowCustom(selectedMode === "custom");
  }, [selectedMode]);

  useEffect(() => {
    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("join_error");
    };
  }, []);

  function getSettings() {
    if (selectedMode === "custom") {
      return {
        rounds: customRounds,
        drawTime: customDrawTime,
        maxPlayers: 8,
      };
    }
    return GAME_MODES.find((m) => m.id === selectedMode).settings;
  }

  function handleCreateRoom() {
    if (!playerName.trim()) {
      setError("Please enter your name!");
      return;
    }
    setError("");
    setLoading(true);
    socket.connect();
    socket.emit("create_room", {
      playerName: playerName.trim(),
      settings: getSettings(),
    });
    socket.on("room_created", ({ roomId, room }) => {
      sessionStorage.setItem("playerName", playerName.trim());
      setLoading(false);
      navigate(`/lobby/${roomId}`, { state: { room } });
    });
  }

  function handleJoinRoom() {
    if (!playerName.trim()) {
      setError("Please enter your name!");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code!");
      return;
    }
    setError("");
    setLoading(true);
    socket.connect();
    socket.emit("join_room", {
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
    socket.on("room_joined", ({ roomId, room }) => {
      sessionStorage.setItem("playerName", playerName.trim());
      setLoading(false);
      navigate(`/lobby/${roomId}`, { state: { room } });
    });
    socket.on("join_error", ({ message }) => {
      setError(message);
      setLoading(false);
      socket.disconnect();
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") roomCode ? handleJoinRoom() : handleCreateRoom();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-10">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Skribbl Clone
          </h1>
          <p className="text-gray-400 text-sm">Draw. Guess. Win.</p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            className="w-full bg-gray-700 text-white placeholder-gray-400
                       rounded-lg px-4 py-3 outline-none border border-gray-600
                       focus:border-blue-500 transition"
          />
        </div>

        {/* Game Mode Selector */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-3 rounded-xl border-2 text-left transition
                  ${
                    selectedMode === mode.id
                      ? "border-blue-500 bg-blue-900/40"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500"
                  }`}
              >
                <div className="text-white text-sm font-semibold">
                  {mode.label}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Settings */}
        {showCustom && (
          <div className="mb-6 bg-gray-700 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Rounds per player:{" "}
                <span className="text-yellow-400 font-bold">
                  {customRounds}
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={6}
                value={customRounds}
                onChange={(e) => setCustomRounds(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-gray-500 text-xs mt-1">
                <span>1</span>
                <span>6</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Draw time:{" "}
                <span className="text-yellow-400 font-bold">
                  {customDrawTime}s
                </span>
              </label>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={customDrawTime}
                onChange={(e) => setCustomDrawTime(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-gray-500 text-xs mt-1">
                <span>30s</span>
                <span>5min</span>
              </div>
            </div>
          </div>
        )}

        {/* Create Room */}
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900
                     disabled:cursor-not-allowed text-white font-semibold
                     py-3 rounded-lg transition mb-4"
        >
          {loading ? "Connecting..." : "🏠 Create Room"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <hr className="flex-1 border-gray-600" />
          <span className="text-gray-500 text-sm">or join existing</span>
          <hr className="flex-1 border-gray-600" />
        </div>

        {/* Join */}
        <input
          type="text"
          placeholder="Room code (e.g. A3KZ92)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={6}
          className="w-full bg-gray-700 text-white placeholder-gray-400
                     rounded-lg px-4 py-3 outline-none border border-gray-600
                     focus:border-green-500 transition mb-3"
        />
        <button
          onClick={handleJoinRoom}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900
                     disabled:cursor-not-allowed text-white font-semibold
                     py-3 rounded-lg transition"
        >
          {loading ? "Joining..." : "🚪 Join Room"}
        </button>

        {error && (
          <div
            className="mt-4 bg-red-900/50 border border-red-500
                          text-red-300 rounded-lg px-4 py-3 text-sm text-center"
          >
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
