import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const geistMono = GeistMono;

// Legacy aliases para não quebrar imports existentes
export const geistSans = inter; // aponta para Inter
export const poppins = { variable: inter.variable };
