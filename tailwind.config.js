/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: 'var(--card)',
                'card-foreground': 'var(--card-foreground)',
                border: 'var(--border)',
                muted: 'var(--muted)',
                'muted-foreground': 'var(--muted-foreground)',
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
        },
    },
    plugins: [],
}
