/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    start: '#FF4458',
                    end: '#FF6B81',
                },
                dark: {
                    bg: '#1A1A2E',
                    card: '#16213E',
                },
                accent: {
                    gold: '#FFD700',
                }
            },
            backgroundImage: {
                'tinder-gradient': 'linear-gradient(45deg, #FF4458, #FF6B81)',
            },
            animation: {
                'pop': 'pop 0.3s ease-out forwards',
            },
            keyframes: {
                pop: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                }
            }
        },
    },
    plugins: [],
}
