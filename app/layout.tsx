import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "仟传小省力 · 达人稿件审核",
    template: "%s · 仟传小省力",
  },
  description: "按项目保存品牌 Brief，持续汇总小红书与抖音达人稿件及审核结果。",
  openGraph: {
    title: "仟传小省力 · 达人稿件审核",
    description: "一个项目，一份 Brief，持续汇总所有达人稿件。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "仟传小省力 · 达人稿件审核",
    description: "一个项目，一份 Brief，持续汇总所有达人稿件。",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
