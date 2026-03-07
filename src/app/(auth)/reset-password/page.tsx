import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">비밀번호 재설정</h1>
        <p className="text-sm text-text-tertiary mb-8">
          소셜 로그인을 사용하므로 별도의 비밀번호 재설정이 필요하지 않습니다.<br />
          Google 또는 카카오 계정의 비밀번호를 변경해주세요.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-[var(--radius-md)] hover:bg-primary-60 transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
