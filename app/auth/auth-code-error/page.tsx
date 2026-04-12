import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-4">로그인 오류</h1>
        <p className="text-slate-600 mb-8">
          인증 코드를 확인하는 중에 문제가 발생했습니다. <br />
          PKCE Flow가 정상적으로 설정되지 않았거나 <br /> 세션이 만료되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-[var(--primary)] text-white font-black rounded-2xl hover:opacity-90 transition-all active:scale-95"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
