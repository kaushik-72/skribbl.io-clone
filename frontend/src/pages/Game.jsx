import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import Canvas from "../components/Canvas";
import PlayerList from "../components/PlayerList";
import Timer from "../components/Timer";
import WordSelection from "../components/WordSelection";
import GuessInput from "../components/GuessInput";
import RoundEnd from "../components/RoundEnd";

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [players, setPlayers] = useState([]);
  const [drawerId, setDrawerId] = useState(null);
  const [drawerName, setDrawerName] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(80);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [wordHint, setWordHint] = useState("");
  const [myWord, setMyWord] = useState(""); // only drawer knows this
  const [wordOptions, setWordOptions] = useState([]);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);

  const isDrawer = socket.id === drawerId;

  // scroll chat to bottom when new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // ── turn starts ──
    socket.on("turn_start", ({ drawerId, drawerName, round, totalRounds }) => {
      setDrawerId(drawerId);
      setDrawerName(drawerName);
      setRound(round);
      setTotalRounds(totalRounds);
      setWordHint("");
      setMyWord("");
      setHasGuessed(false);
      setShowRoundEnd(false);
    });

    // ── drawer chooses word ──
    socket.on("choose_word", ({ words }) => {
      setWordOptions(words);
      setShowWordSelection(true);
    });

    // ── word hint (blanks) sent to guessers ──
    socket.on("word_hint", ({ hint }) => {
      setWordHint(hint);
      setShowWordSelection(false);
    });

    // ── drawer gets confirmed word ──
    socket.on("word_confirmed", ({ word }) => {
      setMyWord(word);
      setShowWordSelection(false);
    });

    // ── hint revealed over time ──
    socket.on("hint_update", ({ hint }) => {
      setWordHint(hint);
    });

    // ── timer tick ──
    socket.on("timer_tick", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    // ── someone guessed correctly ──
    socket.on("player_guessed", ({ playerId, playerName, points, scores }) => {
      setPlayers((prev) =>
        prev.map((p) => {
          const updated = scores.find((s) => s.id === p.id);
          return updated ? { ...p, score: updated.score } : p;
        }),
      );
      if (playerId === socket.id) {
        setHasGuessed(true);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "correct",
          text: `🎉 ${playerName} guessed the word! (+${points} pts)`,
        },
      ]);
    });

    // ── chat message ──
    socket.on("chat_message", ({ playerName, text }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "chat",
          playerName,
          text,
        },
      ]);
    });

    // ── round ended ──
    socket.on("round_end", ({ word, scores }) => {
      setRoundEndData({ word, scores });
      setShowRoundEnd(true);
      setShowWordSelection(false);
    });

    // ── player list updates ──
    socket.on("player_joined", ({ players }) => setPlayers(players));
    socket.on("player_left", ({ players }) => setPlayers(players));

    // ── game over ──
    socket.on("game_over", ({ winner, leaderboard }) => {
      setGameOver(true);
      setWinner(winner);
      setLeaderboard(leaderboard);
      setShowRoundEnd(false);
    });

    return () => {
      socket.off("turn_start");
      socket.off("choose_word");
      socket.off("word_hint");
      socket.off("word_confirmed");
      socket.off("hint_update");
      socket.off("timer_tick");
      socket.off("player_guessed");
      socket.off("chat_message");
      socket.off("round_end");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("game_over");
    };
  }, []);

  function handleWordChosen(word) {
    socket.emit("word_chosen", { roomId, word });
    setMyWord(word);
    setShowWordSelection(false);
  }

  function handleGuess(text) {
    socket.emit("guess", { roomId, text });
  }

  function handlePlayAgain() {
    navigate("/");
  }

  // ── Game Over Screen ──
  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-1">Game Over!</h2>
          <p className="text-yellow-400 text-xl font-bold mb-6">
            {winner?.name} wins!
          </p>

          <div className="text-left mb-6">
            <h3
              className="text-gray-300 font-semibold mb-3 uppercase
                           tracking-wider text-sm"
            >
              Final Leaderboard
            </h3>
            <ul className="space-y-2">
              {leaderboard.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between rounded-lg
                    px-4 py-3 ${p.rank === 1 ? "bg-yellow-900/40" : "bg-gray-700"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 w-4 text-sm">{p.rank}.</span>
                    <span className="text-white font-medium">{p.name}</span>
                    {p.rank === 1 && <span>👑</span>}
                  </div>
                  <span className="text-yellow-400 font-bold">
                    {p.score} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white
                       font-semibold py-3 rounded-xl transition"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main Game Screen ──
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Overlays */}
      {showWordSelection && (
        <WordSelection
          words={wordOptions}
          onChoose={handleWordChosen}
          isDrawer={isDrawer}
          drawerName={drawerName}
        />
      )}
      {showRoundEnd && roundEndData && (
        <RoundEnd word={roundEndData.word} scores={roundEndData.scores} />
      )}

      {/* Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center 
                justify-between bg-gray-800 border-b border-gray-700 
                px-6 py-3 shadow-lg"
      >
        <div className="text-gray-300 text-sm">
          Round <span className="text-white font-bold">{round}</span>
          <span className="text-gray-500"> / {totalRounds}</span>
        </div>

        <div className="text-center">
          {isDrawer ? (
            <div>
              <span className="text-gray-400 text-xs block">Drawing:</span>
              <span className="text-yellow-400 font-bold text-lg capitalize">
                {myWord}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-gray-400 text-xs block">Guess:</span>
              <span className="text-white font-bold text-lg tracking-widest">
                {wordHint || "..."}
              </span>
            </div>
          )}
        </div>

        <div className="w-24">
          <Timer timeLeft={timeLeft} totalTime={totalTime} />
        </div>
      </div>

      {/* Spacer so content doesnt hide behind fixed bar */}
      <div className="h-20" />

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Left — Player List */}
        <div className="w-48 flex-shrink-0">
          <PlayerList
            players={players}
            drawerId={drawerId}
            currentPlayerId={socket.id}
          />
        </div>

        {/* Center — Canvas + Guess */}
        <div className="flex-1 flex flex-col gap-3">
          <Canvas roomId={roomId} isDrawer={isDrawer} />

          {/* Guess input — only for non-drawers */}
          {!isDrawer && (
            <GuessInput
              onGuess={handleGuess}
              disabled={hasGuessed}
              placeholder={
                hasGuessed ? "✅ You guessed correctly!" : "Type your guess..."
              }
            />
          )}

          {isDrawer && (
            <div className="text-center text-gray-400 text-sm py-2">
              ✏️ You are drawing — others are guessing!
            </div>
          )}
        </div>

        {/* Right — Chat */}
        <div
          className="w-56 flex-shrink-0 flex flex-col bg-gray-800
                        rounded-xl overflow-hidden"
        >
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-gray-300 text-sm font-semibold">Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "correct" ? (
                  <div
                    className="bg-green-900/40 border border-green-700
                                  rounded-lg px-2 py-1 text-green-300 text-xs"
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div className="text-xs">
                    <span className="text-blue-400 font-medium">
                      {msg.playerName}:
                    </span>
                    <span className="text-gray-300 ml-1">{msg.text}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
