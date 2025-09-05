import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh] h-screen">
      <h1 className="font-honk text-[15vh] animate-wobble">Transcendence</h1>
      <Link to="/game" className="mt-4 px-12 py-4 bg-stone-950 text-red-600 rounded-lg shadow hover:text-lime-400 font-bit text-2xl flex items-center justify-center">Start Game</Link>
    </div>
  );
}
