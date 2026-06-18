import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTimetable, postSchedule } from '@/api/command';
import { ApiRequestError } from '@/api/errors';
import type { WeeklyGrid } from '@/api/types';
import { WeeklyGrid as WeeklyGridView } from '@/components/timetable/WeeklyGrid';
import { Alert, Button, Card, Input } from '@/components/ui';
import { TimePicker } from '@/components/ui/DatePicker';

const DAYS = [
  { value: 0, label: '월' },
  { value: 1, label: '화' },
  { value: 2, label: '수' },
  { value: 3, label: '목' },
  { value: 4, label: '금' },
  { value: 5, label: '토' },
  { value: 6, label: '일' },
];

export default function TimetableAddPage() {
  const navigate = useNavigate();
  const [previewGrid, setPreviewGrid] = useState<WeeklyGrid | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectName, setSubjectName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTimetable()
      .then((res) => setPreviewGrid(res.grid))
      .catch(() => setPreviewGrid(null));
  }, []);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError('요일을 하나 이상 선택해주세요.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      for (const dayOfWeek of selectedDays) {
        await postSchedule({ dayOfWeek, startTime, endTime, subjectName, location });
      }
      navigate('/timetable');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div
          className="inline-flex cursor-pointer items-center gap-1 typo-label text-brand-primary hover:underline"
          onClick={() => navigate('/timetable')}
        >
          ← 시간표
        </div>
        <h1 className="mt-3 typo-title1 text-text-primary">수업 시간표 추가</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-in-up self-start">
          <h2 className="typo-body-bold text-text-primary mb-4">수업 정보</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}

            <div>
              <label className="mb-2 block typo-label text-text-secondary">
                요일 (다중 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`
                      rounded-[8px] px-4 py-2 text-sm font-medium transition-all duration-200
                      ${
                        selectedDays.includes(d.value)
                          ? 'bg-brand-primary text-white'
                          : 'bg-bg-muted text-text-secondary hover:bg-bg-hover'
                      }
                    `}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <p className="mt-2 typo-caption text-text-muted">
                  선택: {selectedDays.map((d) => DAYS[d].label).join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block typo-label text-text-secondary">과목명</label>
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="예: 웹프로그래밍"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block typo-label text-text-secondary">시작 시간</label>
                <TimePicker value={startTime} onChange={setStartTime} />
              </div>

              <div>
                <label className="mb-2 block typo-label text-text-secondary">종료 시간</label>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>
            </div>

            <div>
              <label className="mb-2 block typo-label text-text-secondary">강의실 (선택)</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 미래관 301호"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting
                ? '등록 중...'
                : selectedDays.length > 1
                  ? `${selectedDays.length}개 요일에 수업 등록`
                  : '수업 등록'}
            </Button>
          </form>
        </Card>

        {previewGrid && (
          <Card className="animate-fade-in-up animate-delay-100 h-full flex flex-col">
            <h2 className="typo-body-bold text-text-primary mb-4">현재 시간표</h2>
            <div className="flex-1 min-h-0">
              <WeeklyGridView grid={previewGrid} compact className="h-full" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
