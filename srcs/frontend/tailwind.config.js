/** @type {import('tailwindcss').Config} */
export default {
	content: [
	  "./index.html",
	  "./app.ts",
	  "./pong.ts",
	],
	theme: {
	  extend: {
		fontFamily: {
		  honk: ['"Honk"', 'system-ui'],
		},
	  },
	},
	plugins: [],
  }
  