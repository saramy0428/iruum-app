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
        {/* Cormorant Garamond — editorial serif for English */}
        {/* Noto Serif KR — refined Korean serif for hangul/hanja */}
        {/* Inter Tight — quiet sans for UI labels */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Noto+Serif+KR:wght@400;500;600;700&family=Inter+Tight:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
