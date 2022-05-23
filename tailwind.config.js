/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'plague-bg': '#050a10', // Deep Navy/Black
                'plague-panel': '#0f172a', // Slate Blue panel
                'plague-accent': '#38bdf8', // Medical Cyan/Blue
                'plague-text': '#e0f2fe', // Light Blue text
                'plague-highlight': '#4ade80', // Safe/Cure Green
            },
            fontFamily: {
                'mono': ['"Courier New"', 'monospace'], // Tech/Terminal feel
                'sans': ['"Roboto"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
