/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{ts,js,html}"],
	theme: {
	  extend: {
		fontFamily: {
		  honk: ['"Honk"', "system-ui"],
		  bit: ['"Bitcount Prop Double"', "sans-serif", "system-ui"],
		},
		keyframes: {
		  wobble: {
			"0%": { transform: "scale(1)", opacity: "1" },
			"50%": { transform: "scale(1.1)", opacity: "1" },
			"100%": { transform: "scale(1)", opacity: "1" },
		  },
		  bigWobble: {
			"0%": { transform: "scale(1)", opacity: "1" },
			"50%": { transform: "scale(1.3)", opacity: "1" },
			"100%": { transform: "scale(1)", opacity: "1" },
		  },
		  flash: {
			"0%, 50%": { opacity: "1" },   // fully visible
    		"50%, 100%": { opacity: "0" }, // fully hidden
		  },
		  fadeIn: {
			"0%": { opacity: "0" },
			"100%": { opacity: "1" },
		  },
		  zoomIn: {
			"0%": { transform: "scale(1)", opacity: "1" },
			"100%": { transform: "scale(1.4)", opacity: "1" },
		  },
		},
		animation: {
		  wobble: "wobble 8s ease-in-out infinite",
		  bigWobble: "bigWobble 2s ease-in-out infinite",
		  flash: "flash 1s steps(1, end) infinite",
		  fadeIn: "fadeIn 2s ease-in forwards",
		  zoomIn: "zoomIn 2s ease-in forwards",
		},
	  },
	},
	plugins: [],
  };
  