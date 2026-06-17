import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReservations, postCancelReservation } from '@/api/command';
import { ApiRequestError } from '@/api/errors';
import type { MyReservation } from '@/api/types';
import { Alert, Badge, Button, Card, EmptyState, LoadingState } from '@/components/ui';

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await getMyReservations());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: number) {
    if (!confirm('예약을 취소하시겠습니까?')) return;
    setError(null);
    try {
      await postCancelReservation(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '취소에 실패했습니다.');
    }
  }

  if (loading) {
    return <LoadingState message="예약 정보를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="typo-title1 text-text-primary">내 예약</h1>
        <p className="mt-1 typo-body3 text-text-secondary">
          {items.filter((i) => i.status === 'confirmed').length}개의 예약이 있습니다
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">🪑</span>}
          title="예약 내역이 없습니다"
          description="스터디룸을 둘러보고 좌석을 예약해보세요."
          action={<Button onClick={() => navigate('/rooms')}>스터디룸 보러가기</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card
              key={item.id}
              className={`animate-fade-in-up ${item.status === 'cancelled' ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={item.status === 'confirmed' ? 'success' : 'default'}>
                      {item.status === 'confirmed' ? '예약됨' : '취소됨'}
                    </Badge>
                  </div>
                  <h2 className="typo-body-bold text-text-primary">
                    {item.roomName} · {item.seatNumber}번
                  </h2>
                  <p className="mt-1 typo-body3 text-text-secondary">
                    {item.date} {item.startTime} ~ {item.endTime}
                  </p>
                </div>

                {item.status === 'confirmed' && (
                  <Button variant="danger" size="sm" onClick={() => cancel(item.id)}>
                    예약 취소
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
