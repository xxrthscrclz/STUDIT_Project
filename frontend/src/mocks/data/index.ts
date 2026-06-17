import type {
  MyReservation,
  RecommendationResult,
  RoomDetail,
  RoomListItem,
  ScheduleItem,
  WeeklyGrid,
} from '@/api/types';
import { DEMO_SCHEDULE_SOURCES, expandDemoSchedules } from '@/mocks/data/defaultSchedules';
import { getMockUser, type StoredMockUser } from '@/utils/auth';

export type MockUser = {
  id: number;
  username: string;
  password: string;
};

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function dayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] ?? '?';
}

export const mockRooms: RoomListItem[] = [
  {
    id: 1,
    name: '미래관 1F 스터디룸 A',
    building: '미래관',
    floor: 1,
    capacity: 8,
    description: '개인 학습 및 소규모 그룹 스터디에 적합한 조용한 공간입니다.',
    displayName: '미래관 1F · 스터디룸 A',
    totalSeats: 8,
    availableSeats: 5,
  },
  {
    id: 2,
    name: '미래관 2F 스터디룸 B',
    building: '미래관',
    floor: 2,
    capacity: 6,
    description: '창가 자리가 있어 채광이 좋은 학습 공간입니다.',
    displayName: '미래관 2F · 스터디룸 B',
    totalSeats: 6,
    availableSeats: 4,
  },
  {
    id: 3,
    name: '미래관 3F 스터디룸 C',
    building: '미래관',
    floor: 3,
    capacity: 10,
    description: '넓은 테이블과 화이트보드가 구비된 그룹 스터디 전용 공간입니다.',
    displayName: '미래관 3F · 스터디룸 C',
    totalSeats: 10,
    availableSeats: 7,
  },
  {
    id: 4,
    name: '미래관 4F 스터디룸 D',
    building: '미래관',
    floor: 4,
    capacity: 4,
    description: '집중 학습을 위한 소규모 개인 부스형 공간입니다.',
    displayName: '미래관 4F · 스터디룸 D',
    totalSeats: 4,
    availableSeats: 2,
  },
  {
    id: 5,
    name: '미래관 5F 스터디룸 E',
    building: '미래관',
    floor: 5,
    capacity: 12,
    description: '프로젝터와 대형 스크린이 설치된 발표 연습 가능 공간입니다.',
    displayName: '미래관 5F · 스터디룸 E',
    totalSeats: 12,
    availableSeats: 9,
  },
  {
    id: 6,
    name: '미래관 6F 스터디룸 F',
    building: '미래관',
    floor: 6,
    capacity: 8,
    description: '최상층 전망과 함께 쾌적한 환경에서 학습할 수 있는 공간입니다.',
    displayName: '미래관 6F · 스터디룸 F',
    totalSeats: 8,
    availableSeats: 6,
  },
];

export const mockRoom = mockRooms[0];

export const seatNumbersByRoom: Record<number, string[]> = {
  1: ['1', '2', '3', '4', '5', '6', '7', '8'],
  2: ['1', '2', '3', '4', '5', '6'],
  3: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  4: ['1', '2', '3', '4'],
  5: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  6: ['1', '2', '3', '4', '5', '6', '7', '8'],
};

export const seatNumbers = seatNumbersByRoom[1];

export let users: MockUser[] = [
  { id: 1, username: 'jooho0813', password: '' },
  { id: 2, username: 'demo', password: '' },
  { id: 3, username: 'student2', password: '' },
];

let nextUserId = 4;
let nextScheduleId = 20;
let nextReservationId = 3;

export function allocUserId() {
  return nextUserId++;
}

export function allocScheduleId() {
  return nextScheduleId++;
}

export function allocReservationId() {
  return nextReservationId++;
}

/** 사용자별 수업 시간표 (Django: user별 ClassSchedule) */
const schedulesByUser = new Map<number, ScheduleItem[]>();

function cloneDemoSchedules(): ScheduleItem[] {
  return expandDemoSchedules(DEMO_SCHEDULE_SOURCES, allocScheduleId);
}

function presetDemoSchedules(): ScheduleItem[] {
  let id = 1;
  return expandDemoSchedules(DEMO_SCHEDULE_SOURCES, () => id++);
}

export function seedSchedulesIfEmpty(userId: number) {
  if (!schedulesByUser.has(userId) || schedulesByUser.get(userId)!.length === 0) {
    schedulesByUser.set(userId, userId <= 3 ? presetDemoSchedules() : cloneDemoSchedules());
  }
}

export function schedulesForUser(userId: number): ScheduleItem[] {
  seedSchedulesIfEmpty(userId);
  return schedulesByUser.get(userId)!;
}

export function getSchedulesForUser(userId: number): ScheduleItem[] {
  return schedulesForUser(userId).map((s) => ({ ...s }));
}

for (const preset of users) {
  seedSchedulesIfEmpty(preset.id);
}

/** 목 로그인: 비밀번호 검사 없이 사용자 조회·생성 */
export function ensureUser(username: string): MockUser {
  const trimmed = username.trim();
  let user = findUserByName(trimmed);
  if (!user) {
    user = { id: allocUserId(), username: trimmed, password: '' };
    users.push(user);
  }
  seedSchedulesIfEmpty(user.id);
  return user;
}

function rehydrateUserFromStorage(stored: StoredMockUser): MockUser {
  let user = findUser(stored.id);
  if (!user) {
    user = { id: stored.id, username: stored.username, password: '' };
    users.push(user);
  }
  seedSchedulesIfEmpty(user.id);
  return user;
}

/** 새로고침 후 MSW 메모리가 비어도 localStorage 토큰으로 사용자 복원 */
export function resolveMockUser(userId: number): MockUser | null {
  const existing = findUser(userId);
  if (existing) {
    seedSchedulesIfEmpty(existing.id);
    return existing;
  }

  const stored = getMockUser();
  if (stored?.id === userId) {
    return rehydrateUserFromStorage(stored);
  }

  return null;
}

export let reservations: (MyReservation & { userId: number })[] = [
  {
    id: 1,
    userId: 1,
    seatId: 102, // roomId(1) * 100 + index(1) + 1 = 102 → 2번 좌석
    seatNumber: '2',
    roomId: 1,
    roomName: mockRoom.displayName,
    date: todayIso(),
    startTime: '13:00',
    endTime: '15:00',
    status: 'confirmed',
  },
  {
    id: 2,
    userId: 3,
    seatId: 104, // roomId(1) * 100 + index(3) + 1 = 104 → 4번 좌석
    seatNumber: '4',
    roomId: 1,
    roomName: mockRoom.displayName,
    date: todayIso(),
    startTime: '16:00',
    endTime: '18:00',
    status: 'confirmed',
  },
];

export function parseToken(authorization: string | null): number | null {
  if (!authorization?.startsWith('Bearer mock-')) {
    return null;
  }
  const id = Number(authorization.replace('Bearer mock-', ''));
  return Number.isFinite(id) ? id : null;
}

export function findUser(id: number) {
  return users.find((u) => u.id === id);
}

export function findUserByName(username: string) {
  return users.find((u) => u.username === username);
}

export function buildWeeklyGrid(
  items: ScheduleItem[],
  forceStart?: number,
  forceEnd?: number,
): WeeklyGrid {
  let startHour = 9;
  let endHour = 18;

  for (const schedule of items) {
    const [sh] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    startHour = Math.min(startHour, sh);
    const neededEnd = em > 0 ? eh + 1 : eh;
    endHour = Math.max(endHour, neededEnd);
  }

  if (forceStart != null) {
    startHour = Math.min(startHour, forceStart);
  }
  if (forceEnd != null) {
    endHour = Math.max(endHour, forceEnd);
  }
  if (endHour <= startHour) {
    endHour = startHour + 1;
  }

  const totalMinutes = (endHour - startHour) * 60;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => ({
    hour: startHour + i,
    label: `${String(startHour + i).padStart(2, '0')}:00`,
  }));

  const blocks = items.map((schedule, index) => {
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm - startHour * 60;
    const endMinutes = eh * 60 + em - startHour * 60;
    const duration = Math.max(endMinutes - startMinutes, 1);
    return {
      scheduleId: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      subjectName: schedule.subjectName,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      dayLabel: schedule.dayLabel,
      topPct: (startMinutes / totalMinutes) * 100,
      heightPct: (duration / totalMinutes) * 100,
      colorIndex: index % 6,
    };
  });

  const days = DAY_LABELS.map((label, index) => ({
    index,
    label,
    blocks: blocks.filter((b) => b.dayOfWeek === index),
  }));

  return { hours, days, startHour, endHour, rowCount: endHour - startHour };
}

export function buildRoomDetail(roomId: number, date: string): RoomDetail | null {
  const room = mockRooms.find((r) => r.id === roomId);
  if (!room) return null;

  const seatNums = seatNumbersByRoom[roomId] ?? ['1'];
  const isToday = date === todayIso();
  const dayReservations = reservations.filter(
    (r) => r.roomId === roomId && r.date === date && r.status === 'confirmed',
  );
  const reservedSeatIds = new Set(dayReservations.map((r) => r.seatId));

  const seats = seatNums.map((num, index) => {
    const seatId = roomId * 100 + index + 1;
    const seatRes = dayReservations.filter((r) => r.seatId === seatId);
    const active = isToday && seatRes.some((r) => timeInRange(r.startTime, r.endTime, nowTime()));
    const hasReservations = seatRes.length > 0;
    return {
      id: seatId,
      seatNumber: num,
      statusLabel: active ? '사용 중' : hasReservations ? '예약 있음' : '예약 가능',
      statusVariant: active ? 'busy' : hasReservations ? 'booked' : 'available',
      inUse: active,
      slots: seatRes.map((r) => ({
        reservationId: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        username: findUser(r.userId)?.username ?? 'user',
        status: 'booked',
      })),
    };
  });

  const reserved = reservedSeatIds.size;
  return {
    ...room,
    selectedDate: date,
    isToday,
    availableSeats: room.totalSeats - reserved,
    reservedSeats: reserved,
    seats,
  };
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeInRange(start: string, end: string, current: string) {
  return start <= current && current < end;
}

export function buildRecommendation(userId: number): RecommendationResult {
  const userSchedules = getSchedulesForUser(userId);
  const grid = buildWeeklyGrid(userSchedules);
  const date = todayIso();
  return {
    summary:
      '수업 2개와 예약 현황을 반영한 MSW 목 추천입니다. 수업 직후·저녁 시간대가 학습 효율에 유리합니다.',
    studyTips:
      '수업 직후 1~2시간은 복습 골든타임입니다. 포모도로(25분 집중 + 5분 휴식)와 요약 노트를 함께 사용해 보세요.',
    llmUsed: false,
    llmStatus: 'MSW 목 모드 — GEMINI_API_KEY 없이 UI만 확인 중입니다.',
    scheduleSummary: userSchedules
      .map((s) => `- ${s.dayLabel} ${s.startTime}~${s.endTime} ${s.subjectName}`)
      .join('\n'),
    hasSchedules: userSchedules.length > 0,
    geminiConfigured: false,
    grid,
    slots: [
      {
        date,
        dayLabel: dayLabel(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1),
        startTime: '11:30',
        endTime: '13:00',
        title: '웹서버컴퓨팅 수업 직후 복습',
        tag: 'after_class',
        afterSubject: '웹서버컴퓨팅',
        comment: '수업 내용이 생생할 때 복습하면 기억 정착에 효과적입니다.',
        studyMethod: '핵심 개념 3가지를 적고 25분 포모도로로 예제를 풀어 보세요.',
        seatId: 1,
        roomName: mockRoom.displayName,
        seatNumber: '1',
      },
      {
        date,
        dayLabel: dayLabel(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1),
        startTime: '19:00',
        endTime: '21:00',
        title: '저녁 정리 · 마무리 학습',
        tag: 'evening_review',
        afterSubject: null,
        comment: '하루 수업을 마친 뒤 저녁 시간에 정리하면 장기 기억에 도움이 됩니다.',
        studyMethod: '한 장 요약 노트로 정리하고 모르는 부분만 표시해 두세요.',
        seatId: 3,
        roomName: mockRoom.displayName,
        seatNumber: '3',
      },
    ],
  };
}
