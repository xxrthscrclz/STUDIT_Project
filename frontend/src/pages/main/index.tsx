import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button, Card } from '@/components/ui';

export default function MainPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const features = [
    {
      title: '시간표 등록',
      description: '수업 시간을 등록하여 스터디룸 예약 시 충돌을 자동으로 검사합니다.',
      icon: '📅',
    },
    {
      title: '좌석 현황 확인',
      description: '실시간 예약 현황 및 날짜별 예약 가능 시간을 조회할 수 있습니다.',
      icon: '🪑',
    },
    {
      title: 'AI 학습 시간 추천',
      description: '시간표와 예약 현황을 바탕으로 Gemini API가 공부하기 좋은 시간을 추천합니다.',
      icon: '🤖',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="animate-fade-in-up rounded-[20px] bg-gradient-to-br from-brand-primary to-brand-deep p-8 text-white shadow-lg">
        <h1 className="typo-title2">
          StudIt <span className="typo-body1 font-normal opacity-80">Study It</span>
        </h1>
        <p className="mt-3 typo-body2 opacity-90 max-w-lg">
          수업 시간표와 겹치지 않게, 스터디룸 좌석을 예약하고 더 나은 공부 환경을 만드세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-[12px] border-2 border-white bg-white px-6 py-3 text-base font-medium text-[#0d6efd] transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
            onClick={() => navigate('/rooms')}
          >
            스터디룸 보러가기
          </button>
          {user && (
            <button
              className="rounded-[12px] border-2 border-white/50 bg-transparent px-6 py-3 text-base font-medium text-white transition-all duration-200 hover:border-white hover:bg-white/15 active:scale-[0.98]"
              onClick={() => navigate('/timetable/recommend')}
            >
              AI 학습 시간 추천
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <div className="grid gap-5 md:grid-cols-3">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            hover
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
          >
            <div className="mb-3 text-3xl">{feature.icon}</div>
            <h2 className="typo-body-bold text-text-primary">{feature.title}</h2>
            <p className="mt-2 typo-body3 text-text-secondary">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* Login prompt for non-logged in users */}
      {!user && (
        <Card className="animate-fade-in-up animate-delay-300 text-center">
          <p className="typo-body2 text-text-secondary">
            로그인하면 시간표 관리와 AI 추천 기능을 이용할 수 있어요.
          </p>
          <Button className="mt-4" onClick={() => navigate('/login')}>
            로그인
          </Button>
        </Card>
      )}
    </div>
  );
}
