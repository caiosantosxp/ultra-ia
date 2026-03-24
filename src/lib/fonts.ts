import { Plus_Jakarta_Sans } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const geistMono = GeistMono;

// Legacy aliases
export const inter = plusJakartaSans;
export const geistSans = plusJakartaSans;
export const poppins = { variable: plusJakartaSans.variable };
