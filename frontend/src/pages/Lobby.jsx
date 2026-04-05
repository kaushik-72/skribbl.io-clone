import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

const Lobby = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [players, setPlayers] = useState(location.state?.room?.players || []);
  const [isHost, setIsHost] = useState(
    location.state?.room?.host === socket.id,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socket.on("player_joined", ({ players }) => {
      setPlayers(players);
    });

    socket.on("player_left", ({ players }) => {
      setPlayers(players);
    });

    socket.on("host_changed", ({ newHostId, players }) => {
      setPlayers(players);
      if (newHostId === socket.id) {
        setIsHost(true);
      }
    });

    socket.on("game_started", () => {
      navigate(`/game/${roomId}`);
    });

    return () => {
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("host_changed");
      socket.off("game_started");
    };
  }, [roomId, navigate]);

  function handleStartGame() {
    socket.emit("start_game", { roomId });
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-1">🎮 Lobby</h2>
          <p className="text-gray-400 text-sm">
            Waiting for players to join...
          </p>
        </div>

        {/* Room Code Box */}
        <div className="bg-gray-700 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest">
            Room Code
          </p>
          <p className="text-3xl font-bold text-yellow-400 tracking-widest mb-2">
            {roomId}
          </p>
          <button
            onClick={copyRoomCode}
            className="text-xs text-gray-400 hover:text-white underline transition"
          >
            {copied ? "✅ Copied!" : "📋 Click to copy"}
          </button>
        </div>

        {/* Game Settings Display */}
        {location.state?.room?.settings && (
          <div className="bg-gray-700/50 rounded-xl px-4 py-3 mb-6 flex justify-around text-center">
            <div>
              <p className="text-gray-400 text-xs">Rounds</p>
              <p className="text-white font-bold">
                {location.state.room.settings.rounds}
              </p>
            </div>
            <div className="w-px bg-gray-600" />
            <div>
              <p className="text-gray-400 text-xs">Draw Time</p>
              <p className="text-white font-bold">
                {location.state.room.settings.drawTime}s
              </p>
            </div>
            <div className="w-px bg-gray-600" />
            <div>
              <p className="text-gray-400 text-xs">Max Players</p>
              <p className="text-white font-bold">
                {location.state.room.settings.maxPlayers}
              </p>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="mb-6">
          <h3 className="text-gray-300 font-semibold mb-3">
            Players ({players.length}/8)
          </h3>
          <ul className="space-y-2">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 bg-gray-700
                           rounded-lg px-4 py-3"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full bg-blue-600
                                flex items-center justify-center
                                text-white font-bold text-sm flex-shrink-0"
                >
                  {p.name[0].toUpperCase()}
                </div>

                <span className="text-white font-medium">{p.name}</span>

                {/* Tags */}
                <div className="ml-auto flex gap-2">
                  {p.isHost && (
                    <span
                      className="text-xs bg-yellow-600
                                     text-white px-2 py-0.5 rounded-full"
                    >
                      Host
                    </span>
                  )}
                  {p.id === socket.id && (
                    <span
                      className="text-xs bg-blue-600
                                     text-white px-2 py-0.5 rounded-full"
                    >
                      You
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Game / Waiting */}
        {isHost ? (
          <div>
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full bg-green-600 hover:bg-green-700
                         disabled:bg-gray-600 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-lg transition"
            >
              {players.length < 2
                ? "⏳ Need at least 2 players..."
                : "🚀 Start Game!"}
            </button>
            {players.length < 2 && (
              <p className="text-gray-500 text-xs text-center mt-2">
                Share the room code to invite friends
              </p>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-2">
            <div
              className="inline-block w-4 h-4 border-2 border-gray-400
                            border-t-white rounded-full animate-spin mr-2"
            />
            Waiting for host to start...
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
