import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh] h-screen">
      <h1 className="font-honk text-[15vh]">Home Page</h1>

      <Link
        to="/game"
        className="h-[5vh] px-6 bg-stone-800 text-white rounded-xl shadow hover:bg-blue-500 font-mono text-base flex items-center justify-center"
      >
        Start Game
      </Link>
    </div>
  );
}
