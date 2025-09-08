import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GameCanvas from "./GameCanvas";

export default function Game() {
  const navigate = useNavigate();
  const [winner, setWinner] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  function onGameOver(player: number) {
    setWinner(player);
    setShowWinner(true);

    // Navigate to results after short delay
    setTimeout(() => {
      navigate("/results", { state: { winner: player } });
    }, 5000);
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-[1vh] pb-[5vh] min-h-[400px] min-w-[600px] relative">
      <h1 className="font-honk text-[8vh]">Pong Game</h1>

      <div className="h-[80vh] aspect-[3/2] max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px]">
        <GameCanvas onGameOver={onGameOver} />
      </div>

      <Link
        to="/"
        className="mt-4 px-6 py-2 text-[5vh] bg-gray-500 rounded-xl shadow hover:bg-gray-600 font-honk"
      >
        Back Home
      </Link>

      {showWinner && winner !== null && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <h2 className="text-[25vh] animate-bigWobble font-honk">
            Player {winner} Wins!
          </h2>
        </div>
      )}
    </div>
  );
}
