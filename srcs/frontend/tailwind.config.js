/** @type {import('tailwindcss').Config} */
export default {
	content: [
	  "./index.html",
	  "./src/*.ts",
	  "./src/*.tsx",
	  "./src/pages/*.tsx",
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
  