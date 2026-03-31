import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0c0a1a',
          surface: '#16132e',
        },
        border: {
          subtle: '#2e2854',
          active: '#7c5cbf',
        },
        rarity: {
          common: '#66bb6a',
          rare: '#42a5f5',
          epic: '#ab7cff',
          legendary: '#ffb74d',
        },
        danger: '#ef5350',
        warning: '#ffa726',
        success: '#66bb6a',
        text: {
          primary: '#f0e8ff',
          secondary: '#d0c4f0',
          muted: '#5a5480',
        },
        star: {
          filled: '#ffd54f',
          empty: '#2e2854',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
};

export default config;
