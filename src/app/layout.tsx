import type { Metadata } from 'next';
import { popFont } from '../lib/fonts';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'SysHack BINGO', // ここの文字列がブラウザのタブに表示される
  description: 'Created by plusU', // こちらはメタタグに表示される文字列
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${popFont.className}`}>
      <body>{children}</body>
    </html>
  );
}
