import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getRoomDetail } from '@/api/command';
import type { RoomDetail } from '@/api/types';
import { useAuthStore } from '@/stores/authStore';
import { Alert, Button, Card, Input, LoadingState } from '@/components/ui';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [date, setDate] = useState(searchParams.get('date') ?? todayIso());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    getRoomDetail(Number(roomId), date)
      .then(setRoom)
      .finally(() => setLoading(false));
  }, [roomId, date]);

  function applyDate() {
    setSearchParams({ date });
  }

  if (loading || !room) {
    return <LoadingState message="스터디룸 정보를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div
          className="inline-flex cursor-pointer items-center gap-1 typo-label text-brand-primary hover:underline"
          onClick={() => navigate('/rooms')}
        >
          ← 목록으로
        </div>
        <h1 className="mt-3 typo-title1 text-text-primary">{room.displayName}</h1>
        <p className="mt-1 typo-body3 text-text-secondary">{room.description}</p>
      </div>

      {/* Date Picker & Stats */}
      <Card className="animate-fade-in-up">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block typo-label text-text-secondary">날짜 선택</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                min={todayIso()}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={applyDate}>조회</Button>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="typo-title1 text-brand-primary">{room.availableSeats}</div>
              <div className="typo-label text-text-muted">예약 가능</div>
            </div>
            <div className="text-center">
              <div className="typo-title1 text-status-error">{room.reservedSeats}</div>
              <div className="typo-label text-text-muted">예약됨</div>
            </div>
            <div className="text-center">
              <div className="typo-title1 text-text-secondary">{room.totalSeats}</div>
              <div className="typo-label text-text-muted">전체</div>
            </div>
          </div>
        </div>
      </Card>

      {!user && (
        <Alert tone="info" className="animate-fade-in-up animate-delay-100">
          좌석을 예약하려면 로그인이 필요합니다.
        </Alert>
      )}

      {/* Seats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {room.seats.map((seat, index) => {
          const isAvailable = seat.statusVariant === 'available';

          return (
            <Card
              key={seat.id}
              className="animate-fade-in-up flex flex-col self-stretch"
              style={{ animationDelay: `${index * 0.03}s` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <h3 className="typo-body-bold text-text-primary">{seat.seatNumber}번 좌석</h3>
                <span
                  className={`
                    typo-label px-2 py-1 rounded-[6px]
                    ${
                      isAvailable
                        ? 'bg-status-success-bg text-status-success-text'
                        : 'bg-status-error-bg text-status-error-text'
                    }
                  `}
                >
                  {isAvailable ? '예약 가능' : '예약됨'}
                </span>
              </div>

              <div className="flex-1">
                {seat.slots.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {seat.slots.map((slot) => (
                      <li
                        key={slot.reservationId}
                        className="typo-caption text-text-secondary flex items-center gap-2"
                      >
                        <span className="inline-block w-2 h-2 rounded-full bg-status-error" />
                        {slot.startTime}~{slot.endTime} ({slot.username})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() =>
                    navigate(`/reservations/create/${seat.id}?date=${room.selectedDate}`)
                  }
                >
                  예약하기
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
