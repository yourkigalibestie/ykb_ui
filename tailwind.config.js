/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0F172A',
                secondary: '#D4AF37',
                accent: '#B08D2E',
                navy: '#0F172A',
                gold: '#D4AF37',
                surface: '#F8FAFC',
                border: '#E5E7EB',
                textSecondary: '#1F2937',
                success: '#16A34A',
                warning: '#F59E0B',
                error: '#DC2626',
                info: '#2563EB',
                'success-bg': '#ECFDF5',
                'warning-bg': '#FFFBEB',
                'error-bg': '#FEF2F2',
                'info-bg': '#EFF6FF',
                dark: '#0F172A',
                'dark-light': '#F8FAFC',
            },
            fontFamily: {
                serif: ['Inter', 'sans-serif'],
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
                card: '0 18px 45px rgba(15, 23, 42, 0.10)',
                gold: '0 14px 30px rgba(212, 175, 55, 0.18)',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1rem',
                '3xl': '1.25rem',
            },
        },
    },
    plugins: [],
};
