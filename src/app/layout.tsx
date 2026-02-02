import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata = {
  title: "스마트 안전지킴이 - 서류 검증",
  description: "AI 기반 산업안전 서류 검증 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="light">
      <head>
        {/* iOS safe-area까지 고려 */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>

      {/* ✅ 스크롤 막지 말기 */}
      <body
  className={[
    manrope.className,
    "bg-background-light dark:bg-background-dark text-slate-800 dark:text-white font-display",
    "min-h-[100dvh] overflow-x-hidden",
  ].join(" ")}
>
  <Providers>{children}</Providers>
</body>
    </html>
  );
}
