import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms } from '@/api/command';
import type { RoomListItem } from '@/api/types';
import { Badge, Card, LoadingState } from '@/components/ui';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms()
      .then(setRooms)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState message="스터디룸 정보를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="typo-title1 text-text-primary">스터디룸</h1>
        <p className="mt-2 typo-body3 text-text-secondary">
          원하는 스터디룸을 선택하고 좌석을 예약하세요
        </p>
      </div>

      {rooms.length === 0 ? (
        <Card className="animate-fade-in-up py-12 text-center">
          <p className="typo-body2 text-text-secondary">등록된 스터디룸이 없습니다.</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, index) => (
            <Card
              key={room.id}
              hover
              className="animate-fade-in-up cursor-pointer flex flex-col"
              style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <Badge variant="info">{room.floor}층</Badge>
                  </div>
                  <h2 className="mt-3 typo-body-bold text-text-primary">{room.name}</h2>
                  <p className="mt-1 typo-body3 text-text-secondary line-clamp-2">
                    {room.description || '설명 없음'}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between border-t border-border-muted pt-4">
                  <div className="typo-label text-text-muted">사용 가능</div>
                  <div className="flex items-center gap-1">
                    <span className="typo-body-bold text-brand-primary">{room.availableSeats}</span>
                    <span className="typo-body3 text-text-muted">/ {room.totalSeats}석</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-primary transition-all duration-500"
                      style={{ width: `${(room.availableSeats / room.totalSeats) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
