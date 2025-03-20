export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" foxified="">
      <body>{children}</body>
    </html>
  );
}