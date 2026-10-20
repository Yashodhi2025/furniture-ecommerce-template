import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@deneb-ui/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #2563eb)',
          secondary: 'var(--brand-secondary, #0f172a)',
          accent: 'var(--brand-accent, #14b8a6)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
