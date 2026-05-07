import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ExpenseFlow",
  description: "Modern expense tracking and financial management platform designed to help users monitor spending, manage budgets, and organize transactions efficiently",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/IOSicon.png" />
        <link rel="icon" href="/icon.png" />
      </head>
      <body className={`${poppins.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}