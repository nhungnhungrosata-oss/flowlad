import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 60px rgba(99, 102, 241, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
