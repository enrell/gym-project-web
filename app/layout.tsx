import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
