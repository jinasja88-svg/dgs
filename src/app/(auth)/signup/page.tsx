import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">회원가입</h1>
        <p className="text-sm text-text-tertiary mb-8">
          딸깍소싱은 소셜 로그인으로 간편하게 가입할 수 있습니다.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
        >
          로그인 페이지로 이동
        </Link>
      </div>
    </div>
  );
}
