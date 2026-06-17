import { http, HttpResponse, delay } from 'msw';
import type { AuthResponse, MeResponse, MyReservation } from '@/api/types';
import {
  allocReservationId,
  allocScheduleId,
  buildRecommendation,
  buildRoomDetail,
  buildWeeklyGrid,
  dayLabel,
  ensureUser,
  findUser,
  getSchedulesForUser,
  schedulesForUser,
  mockRooms,
  seatNumbersByRoom,
  parseToken,
  reservations,
  resolveMockUser,
  todayIso,
} from '@/mocks/data';

const LATENCY_MS = 280;

function unauthorized() {
  return HttpResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
}

function requireUser(request: Request) {
  const userId = parseToken(request.headers.get('Authorization'));
  if (!userId) return null;
  return resolveMockUser(userId);
}

const USER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#3b82f6'];

function buildTimeline(seatId: number, roomId: number, date: string, currentUserId: number) {
  const room = mockRooms.find((r) => r.id === roomId);
  const seatNums = seatNumbersByRoom[roomId] ?? ['1'];
  const seatIndex = seatId - roomId * 100 - 1;
  const seatNumber = seatNums[seatIndex] ?? String(seatId);

  const seatReservations = reservations.filter(
    (r) => r.seatId === seatId && r.date === date && r.status === 'confirmed',
  );
  const userColors = new Map<number, string>();
  const legend: { userName: string; color: string }[] = [];
  let colorIndex = 0;

  const timeline = Array.from({ length: 14 }, (_, i) => {
    const hour = 9 + i;
    const label = `${String(hour).padStart(2, '0')}:00`;
    const endLabel = hour + 1 < 24 ? `${String(hour + 1).padStart(2, '0')}:00` : '24:00';
    const slotStart = `${label}`;
    const slotEnd = endLabel === '24:00' ? '23:59' : endLabel;

    let entry = {
      hour,
      label,
      endLabel,
      status: 'free',
      userName: null as string | null,
      color: null as string | null,
      isMine: false,
    };

    for (const r of seatReservations) {
      if (r.startTime < slotEnd && r.endTime > slotStart) {
        const user = findUser(r.userId);
        if (!userColors.has(r.userId)) {
          userColors.set(r.userId, USER_COLORS[colorIndex % USER_COLORS.length]);
          legend.push({ userName: user?.username ?? 'user', color: userColors.get(r.userId)! });
          colorIndex++;
        }
        entry = {
          hour,
          label,
          endLabel,
          status: 'booked',
          userName: user?.username ?? 'user',
          color: userColors.get(r.userId)!,
          isMine: r.userId === currentUserId,
        };
        break;
      }
    }
    return entry;
  });

  const classSchedules = getSchedulesForUser(currentUserId);

  return {
    seatId,
    seatNumber,
    roomId,
    roomName: room?.displayName ?? '스터디룸',
    date,
    timeline,
    legend,
    classGrid: classSchedules.length > 0 ? buildWeeklyGrid(classSchedules) : null,
    hasClassSchedules: classSchedules.length > 0,
  };
}

export const handlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as { username: string; password: string };
    const user = ensureUser(body.username);
    return HttpResponse.json<AuthResponse>({
      token: `mock-${user.id}`,
      userId: user.id,
      username: user.username,
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(LATENCY_MS);
    const body = (await request.json()) as { username: string; password: string };
    const user = ensureUser(body.username);
    return HttpResponse.json<AuthResponse>({
      token: `mock-${user.id}`,
      userId: user.id,
      username: user.username,
    });
  }),

  http.get('/api/me', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json<MeResponse>({ id: user.id, username: user.username });
  }),

  http.get('/api/rooms', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json(
      mockRooms.map((room) => {
        const reservedToday = reservations.filter(
          (r) => r.roomId === room.id && r.date === todayIso() && r.status === 'confirmed',
        );
        const reservedSeatIds = new Set(reservedToday.map((r) => r.seatId));
        return {
          ...room,
          availableSeats: room.totalSeats - reservedSeatIds.size,
        };
      }),
    );
  }),

  http.get('/api/rooms/:roomId', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const roomId = Number(params.roomId);
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? todayIso();
    const detail = buildRoomDetail(roomId, date);
    if (!detail) {
      return HttpResponse.json({ message: '스터디룸을 찾을 수 없습니다.' }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  http.get('/api/reservations/me', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const items: MyReservation[] = reservations
      .filter((r) => r.userId === user.id)
      .map(({ userId: _u, ...rest }) => rest);
    return HttpResponse.json(items);
  }),

  http.get('/api/reservations/seats/:seatId/timeline', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const seatId = Number(params.seatId);
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? todayIso();
    const roomId = Math.floor(seatId / 100);
    return HttpResponse.json(buildTimeline(seatId, roomId, date, user.id));
  }),

  http.post('/api/reservations', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as {
      seatId: number;
      date: string;
      startTime: string;
      endTime: string;
    };
    if (body.startTime >= body.endTime) {
      return HttpResponse.json(
        { message: '종료 시간은 시작 시간보다 늦어야 합니다.' },
        { status: 400 },
      );
    }
    const overlap = reservations.some(
      (r) =>
        r.status === 'confirmed' &&
        r.date === body.date &&
        r.startTime < body.endTime &&
        r.endTime > body.startTime &&
        (r.seatId === body.seatId || r.userId === user.id),
    );
    if (overlap) {
      return HttpResponse.json(
        { code: 'SEAT_OVERLAP', message: '해당 시간대에 이미 예약되어 있습니다.' },
        { status: 400 },
      );
    }
    const roomId = Math.floor(body.seatId / 100);
    const room = mockRooms.find((r) => r.id === roomId);
    const seatNums = seatNumbersByRoom[roomId] ?? ['1'];
    const seatIndex = body.seatId - roomId * 100 - 1;
    const seatNumber = seatNums[seatIndex] ?? String(body.seatId);

    const item: MyReservation & { userId: number } = {
      id: allocReservationId(),
      userId: user.id,
      seatId: body.seatId,
      seatNumber,
      roomId,
      roomName: room?.displayName ?? '스터디룸',
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'confirmed',
    };
    reservations.unshift(item);
    const { userId: _u, ...rest } = item;
    return HttpResponse.json(rest);
  }),

  http.post('/api/reservations/:id/cancel', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const id = Number(params.id);
    const target = reservations.find((r) => r.id === id);
    if (!target || target.userId !== user.id) {
      return HttpResponse.json({ message: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }
    target.status = 'cancelled';
    const { userId: _u, ...rest } = target;
    return HttpResponse.json(rest);
  }),

  http.get('/api/timetable', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const list = getSchedulesForUser(user.id);
    return HttpResponse.json({
      schedules: list,
      grid: buildWeeklyGrid(list),
    });
  }),

  http.post('/api/timetable', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const body = (await request.json()) as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      subjectName: string;
      location?: string;
    };
    const item = {
      id: allocScheduleId(),
      dayOfWeek: body.dayOfWeek,
      dayLabel: dayLabel(body.dayOfWeek),
      startTime: body.startTime,
      endTime: body.endTime,
      subjectName: body.subjectName,
      location: body.location ?? '',
    };
    schedulesForUser(user.id).push(item);
    return HttpResponse.json(item);
  }),

  http.delete('/api/timetable/:id', async ({ params, request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    const id = Number(params.id);
    const list = schedulesForUser(user.id);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: '시간표를 찾을 수 없습니다.' }, { status: 404 });
    }
    list.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/timetable/recommendations', async ({ request }) => {
    await delay(LATENCY_MS);
    const user = requireUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(buildRecommendation(user.id));
  }),
];
