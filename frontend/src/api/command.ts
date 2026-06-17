import { api } from '@/api/axios';
import type {
  AuthResponse,
  MeResponse,
  MyReservation,
  RecommendationResult,
  RoomDetail,
  RoomListItem,
  ScheduleItem,
  WeeklyGrid,
} from '@/api/types';

export const postSignup = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/signup', { username, password }).then((r) => r.data);

export const postLogin = (username: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { username, password }).then((r) => r.data);

export const getMe = () => api.get<MeResponse>('/me').then((r) => r.data);

export const getRooms = () => api.get<RoomListItem[]>('/rooms').then((r) => r.data);

export const getRoomDetail = (roomId: number, date: string) =>
  api.get<RoomDetail>(`/rooms/${roomId}`, { params: { date } }).then((r) => r.data);

export const getMyReservations = () =>
  api.get<MyReservation[]>('/reservations/me').then((r) => r.data);

export type SeatTimelineResponse = {
  seatId: number;
  seatNumber: string;
  roomId: number;
  roomName: string;
  date: string;
  timeline: {
    hour: number;
    label: string;
    endLabel: string;
    status: string;
    userName: string | null;
    color: string | null;
    isMine: boolean;
  }[];
  legend: { userName: string; color: string }[];
  classGrid: WeeklyGrid | null;
  hasClassSchedules: boolean;
};

export const getSeatTimeline = (seatId: number, date: string) =>
  api
    .get<SeatTimelineResponse>(`/reservations/seats/${seatId}/timeline`, { params: { date } })
    .then((r) => r.data);

export const postReservation = (payload: {
  seatId: number;
  date: string;
  startTime: string;
  endTime: string;
}) => api.post<MyReservation>('/reservations', payload).then((r) => r.data);

export const postCancelReservation = (id: number) =>
  api.post<MyReservation>(`/reservations/${id}/cancel`).then((r) => r.data);

export type TimetableResponse = {
  schedules: ScheduleItem[];
  grid: WeeklyGrid;
};

export const getTimetable = () => api.get<TimetableResponse>('/timetable').then((r) => r.data);

export const postSchedule = (payload: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  location?: string;
}) => api.post<ScheduleItem>('/timetable', payload).then((r) => r.data);

export const deleteSchedule = (id: number) => api.delete(`/timetable/${id}`);

export const getRecommendations = () =>
  api.get<RecommendationResult>('/timetable/recommendations').then((r) => r.data);
