import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'MarkdownIDE - 现代化在线 Markdown 编辑器',
  description: '专业的在线 Markdown 编辑器，具有类似 VSCode 的界面设计和强大的协作功能',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}