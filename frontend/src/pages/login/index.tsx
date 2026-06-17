import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiRequestError } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { Alert, Button, Card, Input } from '@/components/ui';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="animate-fade-in-up mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="typo-title1 text-text-primary">로그인</h1>
          <p className="mt-2 typo-body3 text-text-secondary">StudIt에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}

          <div>
            <label className="mb-2 block typo-label text-text-secondary">사용자 이름</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자 이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="mb-2 block typo-label text-text-secondary">비밀번호</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="typo-body3 text-text-muted">
            계정이 없으신가요?{' '}
            <span
              className="cursor-pointer text-brand-primary hover:underline"
              onClick={() => navigate('/signup')}
            >
              회원가입
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
