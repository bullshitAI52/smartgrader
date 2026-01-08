import type { Metadata } from "next";
import "./globals.css";
// import { Navigation } from "@/components/shared/navigation"; // Removed Navigation since it's not used in page.tsx layout either or causes issues? Wait, current page.tsx includes header. Navigation component might be redundant or conflicting if not used. 
// Actually, let's keep Navigation if it exists, but user asked for specific page structure.
// The error is about fonts.

export const metadata: Metadata = {
  title: "SmartGrader - 智能阅卷系统",
  description: "AI驱动的家庭作业辅导系统，提供智能阅卷、作业辅导和学情分析功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
