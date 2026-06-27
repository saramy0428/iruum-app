import "./globals.css";

export const metadata = {
  title: "iRuum — Your Korean Name",
  description:
    "Discover the Korean name your birth chart calls for. A blend of Saju (Four Pillars) and the Five Elements, translated for you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Noto Sans KR — unified type for Latin + hangul/hanja */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
