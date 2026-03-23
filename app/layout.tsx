import type { Metadata } from "next";
import "./styles/globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Piggy Admin",
  description: "Panel administrativo de Piggy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme="piggy" lang="en">
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
