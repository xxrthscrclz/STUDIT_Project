import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '@/api/errors';
import { useAuthStore } from '@/stores/authStore';
import { Alert, Button, Card, Input } from '@/components/ui';

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="animate-fade-in-up mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="typo-title1 text-text-primary">회원가입</h1>
          <p className="mt-2 typo-body3 text-text-secondary">새로운 계정을 만들어보세요</p>
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

          <div>
            <label className="mb-2 block typo-label text-text-secondary">비밀번호 확인</label>
            <Input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              error={password2.length > 0 && password !== password2}
              required
            />
            {password2.length > 0 && password !== password2 && (
              <p className="mt-1 typo-caption text-status-error">비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? '가입 중...' : '가입하기'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="typo-body3 text-text-muted">
            이미 계정이 있으신가요?{' '}
            <span
              className="cursor-pointer text-brand-primary hover:underline"
              onClick={() => navigate('/login')}
            >
              로그인
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
