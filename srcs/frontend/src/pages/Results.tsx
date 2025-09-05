import React from 'react';
import { Link } from 'react-router-dom';

export default function Results() {
  return (
    <div id="results" className="flex flex-col justify-center items-center min-h-[400px] min-w-[600px] gap-[1vh] pb-[5vh] font-honk text-[5vh]">
      <h1>Results Page</h1>
	  <Link to="/" id="back-home" className="px-6 py-2 bg-gray-500 text-white rounded-xl shadow hover:bg-gray-600">Back Home</Link>
    </div>
  );
}
