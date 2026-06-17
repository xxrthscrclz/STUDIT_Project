import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItemClass = `
    cursor-pointer rounded-[8px] px-3 py-2 text-sm font-medium
    transition-all duration-200
    hover:bg-white/15 active:scale-[0.98]
  `;

  return (
    <nav className="bg-gradient-to-r from-brand-primary to-brand-deep text-text-inverse shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div
          className="cursor-pointer text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          onClick={() => navigate('/')}
        >
          StudIt
        </div>

        <div className="flex items-center gap-1">
          <div className={navItemClass} onClick={() => navigate('/rooms')}>
            스터디룸
          </div>

          {user ? (
            <>
              <div className={navItemClass} onClick={() => navigate('/timetable')}>
                시간표
              </div>
              <div className={navItemClass} onClick={() => navigate('/timetable/recommend')}>
                AI 추천
              </div>
              <div className={navItemClass} onClick={() => navigate('/reservations')}>
                내 예약
              </div>

              <div className="mx-2 h-5 w-px bg-white/30" />

              <div className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold">
                {user.username}
              </div>
              <div className={navItemClass} onClick={handleLogout}>
                로그아웃
              </div>
            </>
          ) : (
            <>
              <div className={navItemClass} onClick={() => navigate('/login')}>
                로그인
              </div>
              <div
                className="cursor-pointer rounded-[8px] bg-white px-4 py-2 text-sm font-semibold text-brand-primary transition-all duration-200 hover:bg-brand-light hover:shadow-brand active:scale-[0.98]"
                onClick={() => navigate('/signup')}
              >
                회원가입
              </div>
            </>
          )}

          <div className="mx-2 h-5 w-px bg-white/30" />

          {/* Theme Toggle */}
          <div
            className="cursor-pointer rounded-[8px] p-2 transition-all duration-200 hover:bg-white/15 active:scale-[0.95]"
            onClick={toggleTheme}
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
