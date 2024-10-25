import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI聊天助手",
  description: "与AI助手开始智能对话",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
