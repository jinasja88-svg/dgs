'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // 실제로는 API를 호출하지만, 여기서는 시뮬레이션
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '문의하기' }]} />

      <h1 className="text-3xl font-bold text-text-primary mt-6 mb-2">문의하기</h1>
      <p className="text-text-tertiary mb-8">
        궁금한 점이 있으시면 아래 양식을 작성해주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="이름" name="name" required placeholder="홍길동" />
          <Input label="이메일" name="email" type="email" required placeholder="email@example.com" />
        </div>
        <Input label="연락처" name="phone" type="tel" placeholder="010-0000-0000" />
        <Input label="제목" name="subject" required placeholder="문의 제목을 입력해주세요" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">내용</label>
          <textarea
            name="message"
            required
            rows={6}
            placeholder="문의 내용을 자세히 작성해주세요"
            className="w-full px-4 py-3 border border-border rounded-[var(--radius-md)] text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-tertiary"
          />
        </div>
        <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full">
          문의 보내기
        </Button>
      </form>
    </div>
  );
}
