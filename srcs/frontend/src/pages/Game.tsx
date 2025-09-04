import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { startPong } from '../pong'; // import your existing pong.ts

export default function Game() {
  useEffect(() => {
    startPong(); // start the Pong game when component mounts
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-[1vh] pb-[5vh] min-h-[400px] min-w-[600px]">
      <h1 className="font-honk text-[5vh]">Pong Game</h1>

      <canvas
        id="game-canvas"
        className="bg-black h-[80vh] aspect-[3/2] max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] min-w-[300px] min-h-[200px] block"
      ></canvas>

      <Link
        to="/"
        className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600 font-sans"
      >
        Back Home
      </Link>
    </div>
  );
}
