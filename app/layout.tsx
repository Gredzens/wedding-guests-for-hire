import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Wedding Guests for Hire | Patriks Gredzens",
  description: "Friends Included financial dashboard",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
