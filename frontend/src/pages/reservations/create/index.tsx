import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getSeatTimeline, postReservation, type SeatTimelineResponse } from '@/api/command';
import { ApiRequestError } from '@/api/errors';
import { WeeklyGrid as WeeklyGridView } from '@/components/timetable/WeeklyGrid';
import { Alert, Badge, Button, Card, LoadingState } from '@/components/ui';
import { DatePicker, TimePicker } from '@/components/ui/DatePicker';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultTimes() {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  if (now >= start) {
    start.setHours(start.getHours() + 1);
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(end) };
}

export default function ReservationCreatePage() {
  const navigate = useNavigate();
  const { seatId } = useParams();
  const [searchParams] = useSearchParams();
  const defaults = useMemo(() => defaultTimes(), []);
  const [date, setDate] = useState(searchParams.get('date') ?? todayIso());
  const [startTime, setStartTime] = useState(
    searchParams.get('start_time') ?? searchParams.get('startTime') ?? defaults.start,
  );
  const [endTime, setEndTime] = useState(
    searchParams.get('end_time') ?? searchParams.get('endTime') ?? defaults.end,
  );
  const [timeline, setTimeline] = useState<SeatTimelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!seatId) return;
    getSeatTimeline(Number(seatId), date)
      .then(setTimeline)
      .catch(() => setTimeline(null));
  }, [seatId, date]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!seatId) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await postReservation({
        seatId: Number(seatId),
        date,
        startTime,
        endTime,
      });
      setSuccess('예약이 완료되었습니다!');
      setTimeline(await getSeatTimeline(Number(seatId), date));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!timeline) {
    return <LoadingState message="좌석 정보를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div
          className="inline-flex cursor-pointer items-center gap-1 typo-label text-brand-primary hover:underline"
          onClick={() => navigate(`/rooms/${timeline.roomId}?date=${date}`)}
        >
          ← 스터디룸
        </div>
        <h1 className="mt-3 typo-title1 text-text-primary">
          {timeline.roomName} · {timeline.seatNumber}번 좌석
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* 왼쪽: 예약 정보 + 시간대별 현황 */}
        <div className="space-y-4">
          <Card className="animate-fade-in-up">
            <h2 className="typo-body-bold text-text-primary mb-4">예약 정보</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert tone="error">{error}</Alert>}
              {success && <Alert tone="success">{success}</Alert>}

              <div>
                <label className="mb-2 block typo-label text-text-secondary">날짜</label>
                <DatePicker value={date} onChange={setDate} minDate={todayIso()} />
              </div>

              <div>
                <label className="mb-2 block typo-label text-text-secondary">시작 시간</label>
                <TimePicker value={startTime} onChange={setStartTime} />
              </div>

              <div>
                <label className="mb-2 block typo-label text-text-secondary">종료 시간</label>
                <TimePicker value={endTime} onChange={setEndTime} />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? '예약 중...' : '예약하기'}
              </Button>
            </form>
          </Card>

          <Card className="animate-fade-in-up animate-delay-100">
            <h2 className="typo-body-bold text-text-primary mb-3">
              시간대별 현황 <span className="typo-caption text-text-muted">({date})</span>
            </h2>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
              {timeline.timeline.map((slot) => (
                <div
                  key={slot.hour}
                  className={`flex items-center justify-between rounded-[6px] border px-3 py-2 transition-all duration-200 ${
                    slot.status === 'free'
                      ? 'border-border-muted bg-bg-card hover:bg-bg-hover'
                      : slot.isMine
                        ? 'border-brand-primary bg-brand-light'
                        : 'border-border-strong bg-bg-muted'
                  }`}
                >
                  <span className="typo-caption text-text-primary">
                    {slot.label} ~ {slot.endLabel}
                  </span>
                  {slot.status === 'free' ? (
                    <Badge variant="success">비어 있음</Badge>
                  ) : (
                    <Badge variant={slot.isMine ? 'info' : 'default'}>
                      {slot.isMine ? '내 예약' : (slot.userName ?? '예약됨')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 오른쪽: 수업 시간표 */}
        {timeline.hasClassSchedules && timeline.classGrid && (
          <Card className="animate-fade-in-up animate-delay-200 h-fit lg:sticky lg:top-4">
            <h2 className="typo-body-bold text-text-primary mb-3">내 수업 시간표</h2>
            <WeeklyGridView grid={timeline.classGrid} compact className="h-full" />
          </Card>
        )}
      </div>
    </div>
  );
}
