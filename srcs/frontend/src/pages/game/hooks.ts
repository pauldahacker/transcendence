import { useEffect } from "react";
import { startPong } from "./pong";

export function usePong(canvasRef: React.RefObject<HTMLCanvasElement | null>, onGameOver: (winner: number) => void) {
  useEffect(() => {
    if (!canvasRef.current) return;

    // Start the game
    const cleanup = startPong(canvasRef.current, onGameOver);

    // Stop the game when component unmounts
    return () => {
      cleanup();
    };
  }, [canvasRef, onGameOver]);
}
