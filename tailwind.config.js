/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Same monospace font in every browser: Menlo on all Apple devices
        // (Safari would otherwise pick SF Mono), then the bundled Geist Mono
        // for devices without Menlo.
        mono: ['Menlo', 'var(--font-geist-mono)', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} 