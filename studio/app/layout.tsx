import type { Metadata } from 'next';
import './globals.css';
import './driving-world.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://piguannan.com/'),
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  title: 'π·冠南的片场｜影视 × 产品 × AI',
  description: '一个可以开车探索的创作片场。认识李冠南的履历，浏览影视与产品实践、17 个公开代码仓库、AI 教学和生活工具。',
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
