import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThoraxVision",
  description:
    "AI-assisted Tuberculosis screening from chest X-rays — DenseNet121 with Grad-CAM explainability.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
