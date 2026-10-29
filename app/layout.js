import "./globals.css";

export const metadata = {
  title: "StudySwap AI",
  description: "Your personal AI tutor"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
