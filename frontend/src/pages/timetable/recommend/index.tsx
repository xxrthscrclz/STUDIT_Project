import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations } from '@/api/command';
import type { RecommendationResult } from '@/api/types';
import { WeeklyGrid } from '@/components/timetable/WeeklyGrid';
import { Alert, Badge, Button, Card, LoadingState } from '@/components/ui';

export default function RecommendPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setResult(await getRecommendations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !result) {
    return <LoadingState message="AI가 학습 시간을 분석 중..." />;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="typo-title1 text-text-primary">AI 학습 시간 추천</h1>
          <p className="mt-1 typo-body3 text-text-secondary">
            시간표와 예약 현황을 분석하여 최적의 학습 시간을 추천합니다
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          다시 추천받기
        </Button>
      </div>

      <Alert tone={result.llmUsed ? 'success' : 'info'} className="animate-fade-in-up">
        {result.llmStatus}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-in-up">
          <h2 className="typo-body-bold text-text-primary mb-3">요약</h2>
          <p className="typo-body3 text-text-secondary whitespace-pre-line">{result.summary}</p>

          <h3 className="typo-body-bold text-text-primary mt-5 mb-3">학습 팁</h3>
          <div className="rounded-[12px] bg-bg-muted p-4">
            <p className="typo-body3 text-text-secondary whitespace-pre-line">{result.studyTips}</p>
          </div>
        </Card>

        {result.grid && result.hasSchedules && (
          <Card className="animate-fade-in-up animate-delay-100">
            <h2 className="typo-body-bold text-text-primary mb-3">내 시간표</h2>
            <WeeklyGrid grid={result.grid} compact />
          </Card>
        )}
      </div>

      <div className="space-y-4 animate-fade-in-up animate-delay-200">
        <h2 className="typo-title1 text-text-primary">추천 시간대</h2>

        {result.slots.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="typo-body2 text-text-secondary">추천 가능한 시간대가 없습니다.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {result.slots.map((slot, index) => (
              <Card
                key={`${slot.date}-${slot.startTime}-${index}`}
                hover
                className="animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">
                        {slot.tag === 'after_class' ? '수업 후' : '저녁'}
                      </Badge>
                      <span className="typo-label text-text-muted">
                        {slot.dayLabel} {slot.date}
                      </span>
                    </div>
                    <h3 className="typo-body-bold text-text-primary">{slot.title}</h3>
                    <p className="mt-1 typo-body3 text-text-secondary">
                      {slot.startTime} ~ {slot.endTime}
                    </p>
                    <p className="mt-1 typo-label text-brand-primary">
                      {slot.roomName} · {slot.seatNumber}번 좌석
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/reservations/create/${slot.seatId}?date=${slot.date}&start_time=${slot.startTime}&end_time=${slot.endTime}`,
                      )
                    }
                  >
                    예약
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border-muted">
                  <p className="typo-body3 text-text-secondary">{slot.comment}</p>
                  <div className="mt-3 rounded-[8px] bg-bg-muted p-3">
                    <p className="typo-caption text-text-muted">{slot.studyMethod}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
