import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = join(process.cwd(), 'docs', filePath);
    
    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      return new NextResponse('文档未找到', { status: 404 });
    }
    
    // 读取文件内容
    const content = await readFile(fullPath, 'utf-8');
    
    // 返回Markdown内容，设置正确的Content-Type
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    });
  } catch (error) {
    console.error('读取文档文件失败:', error);
    return new NextResponse('服务器错误', { status: 500 });
  }
} 