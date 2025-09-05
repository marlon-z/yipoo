/**
 * 文件上传处理器
 * 负责处理Milkdown编辑器中的文件上传功能
 */

export interface UploadResult {
  url: string;
  alt?: string;
  title?: string;
}

export interface UploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的文件类型
  uploadPath: string; // 上传路径
}

export class UploadHandler {
  private config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'text/plain',
        'text/markdown'
      ],
      uploadPath: 'uploads',
      ...config
    };
  }

  /**
   * 验证文件是否符合上传要求
   */
  private validateFile(file: File): string | null {
    // 检查文件大小
    if (file.size > this.config.maxFileSize) {
      return `文件大小不能超过 ${this.formatFileSize(this.config.maxFileSize)}`;
    }

    // 检查文件类型
    if (!this.config.allowedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }

    return null;
  }

  /**
   * 格式化文件大小显示
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成唯一文件名
   */
  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || '';
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * 将文件转换为Base64数据URL（用于本地存储）
   */
  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 将文件保存到本地存储（浏览器环境）
   */
  private async saveToLocalStorage(file: File, fileName: string): Promise<string> {
    try {
      const dataURL = await this.fileToDataURL(file);
      
      // 保存到localStorage (注意大小限制)
      const storageKey = `upload_${fileName}`;
      localStorage.setItem(storageKey, dataURL);
      
      // 返回本地访问URL
      return `local://${storageKey}`;
    } catch (error) {
      console.error('保存文件到本地存储失败:', error);
      throw new Error('文件保存失败');
    }
  }

  /**
   * 处理文件上传
   */
  async handleUpload(file: File): Promise<UploadResult> {
    // 验证文件
    const validationError = this.validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      // 生成文件名
      const fileName = this.generateFileName(file);
      
      // 判断是否为图片
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        // 图片文件：保存到本地存储并返回数据URL
        const dataURL = await this.fileToDataURL(file);
        
        return {
          url: dataURL,
          alt: file.name,
          title: file.name
        };
      } else {
        // 非图片文件：保存到本地存储
        const localURL = await this.saveToLocalStorage(file, fileName);
        
        return {
          url: localURL,
          alt: file.name,
          title: `${file.name} (${this.formatFileSize(file.size)})`
        };
      }
    } catch (error) {
      console.error('文件上传处理失败:', error);
      throw new Error('文件上传失败');
    }
  }

  /**
   * 批量上传文件
   */
  async handleMultipleUploads(files: FileList): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.handleUpload(files[i]);
        results.push(result);
      } catch (error) {
        console.error(`文件 ${files[i].name} 上传失败:`, error);
        // 继续处理其他文件，不中断整个流程
      }
    }
    
    return results;
  }

  /**
   * 清理本地存储中的上传文件
   */
  static cleanupLocalStorage(daysOld: number = 7): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('upload_')) {
        try {
          // 从文件名中提取时间戳
          const fileName = key.replace('upload_', '');
          const timestamp = parseInt(fileName.split('_')[0]);
          
          if (timestamp < cutoffTime) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // 如果解析失败，删除该项
          localStorage.removeItem(key!);
        }
      }
    }
  }
}

// 创建默认的上传处理器实例
export const defaultUploadHandler = new UploadHandler();

// 为Milkdown提供的上传函数
export const milkdownUploader = async (files: FileList): Promise<UploadResult[]> => {
  return defaultUploadHandler.handleMultipleUploads(files);
}; 