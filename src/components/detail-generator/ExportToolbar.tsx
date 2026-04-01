'use client';

import { useState, useRef } from 'react';
import { Copy, Check, Download, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExportToolbarProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
  productTitle: string;
}

export default function ExportToolbar({ previewRef, productTitle }: ExportToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyHtml = async () => {
    if (!previewRef.current) return;

    // Clone and convert to self-contained HTML with inline styles
    const el = previewRef.current;
    const clone = el.cloneNode(true) as HTMLElement;

    // Remove edit buttons from clone
    clone.querySelectorAll('[data-edit-btn]').forEach((btn) => btn.remove());
    clone.querySelectorAll('.group-hover\\:opacity-100').forEach((btn) => btn.remove());

    // Replace proxy image URLs with original alicdn URLs
    clone.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('/api/image-proxy?url=')) {
        const originalUrl = decodeURIComponent(src.split('url=')[1] || '');
        if (originalUrl) img.setAttribute('src', originalUrl);
      }
    });

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a1a; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${clone.innerHTML}
</body>
</html>`;

    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = html;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${productTitle || '상세페이지'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image download error:', err);
      alert('이미지 다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <Button variant="primary" size="lg" onClick={handleCopyHtml}>
        {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
        {copied ? 'HTML 복사 완료!' : 'HTML 복사'}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={handleDownloadImage}
        isLoading={downloading}
      >
        <ImageIcon className="w-4 h-4 mr-1.5" />
        이미지 다운로드
      </Button>
    </div>
  );
}
