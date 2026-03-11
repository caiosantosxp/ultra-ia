import localFont from 'next/font/local';

export const poppins = localFont({
  src: [
    {
      path: '../../public/fonts/poppins-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/poppins-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
  display: 'swap',
});

export const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter-latin.woff2',
      weight: '400 600',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});
