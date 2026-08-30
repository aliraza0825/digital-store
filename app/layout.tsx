import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Store",
  description: "Canva templates, ebooks & PDFs — instant download",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="font-semibold text-lg text-brand-dark">
              Digital Store
            </a>
            <span className="text-sm text-gray-500">Instant download after payment</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-gray-400">
          Secure checkout powered by Lemon Squeezy.
        </footer>
      </body>
    </html>
  );
}
