import React, { useEffect, useRef } from "react";
import { usePong } from "./hooks";

interface GameCanvasProps {
  onGameOver: (winner: number) => void;
}

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Use the custom hook
  usePong(canvasRef, onGameOver);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      className="w-full h-full border border-gray-500 rounded"
    />
  );
}
