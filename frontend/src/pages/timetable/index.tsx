import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteSchedule, getTimetable } from '@/api/command';
import type { TimetableResponse } from '@/api/command';
import { WeeklyGrid as WeeklyGridView } from '@/components/timetable/WeeklyGrid';
import { Button, Card, EmptyState, LoadingState } from '@/components/ui';

type GroupedSchedule = {
  subjectName: string;
  location: string;
  schedules: { id: number; dayLabel: string; startTime: string; endTime: string }[];
};

function groupSchedulesBySubject(schedules: TimetableResponse['schedules']): GroupedSchedule[] {
  const map = new Map<string, GroupedSchedule>();

  for (const s of schedules) {
    const key = `${s.subjectName}||${s.location}`;
    if (!map.has(key)) {
      map.set(key, { subjectName: s.subjectName, location: s.location, schedules: [] });
    }
    map.get(key)!.schedules.push({
      id: s.id,
      dayLabel: s.dayLabel,
      startTime: s.startTime,
      endTime: s.endTime,
    });
  }

  return Array.from(map.values());
}

export default function TimetablePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<TimetableResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setData(await getTimetable());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm('이 수업을 삭제하시겠습니까?')) return;
    await deleteSchedule(id);
    await load();
  }

  async function removeGroup(ids: number[]) {
    if (!confirm('이 과목의 모든 시간을 삭제하시겠습니까?')) return;
    for (const id of ids) {
      await deleteSchedule(id);
    }
    await load();
  }

  if (loading || !data) {
    return <LoadingState message="시간표를 불러오는 중..." />;
  }

  const grouped = groupSchedulesBySubject(data.schedules);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="typo-title1 text-text-primary">내 수업 시간표</h1>
          <p className="mt-1 typo-body3 text-text-secondary">
            {grouped.length}개의 과목, {data.schedules.length}개의 수업이 등록되어 있습니다
          </p>
        </div>
        <Button onClick={() => navigate('/timetable/add')}>시간표 추가</Button>
      </div>

      {data.schedules.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📅</span>}
          title="등록된 수업이 없습니다"
          description="시간표를 추가하면 AI 추천 기능을 더 정확하게 사용할 수 있어요."
          action={<Button onClick={() => navigate('/timetable/add')}>첫 수업 추가하기</Button>}
        />
      ) : (
        <>
          <div className="animate-fade-in-up">
            <WeeklyGridView grid={data.grid} />
          </div>

          <div className="space-y-4 animate-fade-in-up animate-delay-200">
            <h2 className="typo-body-bold text-text-primary">수업 목록</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {grouped.map((group, index) => (
                <Card
                  key={`${group.subjectName}-${group.location}`}
                  className="animate-slide-in-right flex flex-col"
                  style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                >
                  <div className="flex items-start justify-between gap-3 flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="typo-body-bold text-text-primary truncate">
                        {group.subjectName}
                      </p>
                      {group.location && (
                        <p className="typo-caption text-text-muted mt-0.5 truncate">
                          {group.location}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.schedules.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 rounded-full bg-bg-muted px-2 py-0.5 typo-caption text-text-secondary"
                          >
                            {s.dayLabel} {s.startTime}~{s.endTime}
                            <button
                              className="ml-0.5 text-text-muted hover:text-status-error transition-colors"
                              onClick={() => remove(s.id)}
                              title="이 시간만 삭제"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeGroup(group.schedules.map((s) => s.id))}
                      className="shrink-0"
                    >
                      삭제
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
