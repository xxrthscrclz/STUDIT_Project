export type AuthResponse = {
  token: string;
  userId: number;
  username: string;
};

export type MeResponse = {
  id: number;
  username: string;
};

export type RoomListItem = {
  id: number;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  description: string;
  displayName: string;
  totalSeats: number;
  availableSeats: number;
};

export type SlotItem = {
  reservationId: number;
  startTime: string;
  endTime: string;
  username: string;
  status: string;
};

export type SeatItem = {
  id: number;
  seatNumber: string;
  statusLabel: string;
  statusVariant: string;
  slots: SlotItem[];
  inUse: boolean;
};

export type RoomDetail = {
  id: number;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  description: string;
  displayName: string;
  selectedDate: string;
  isToday: boolean;
  totalSeats: number;
  availableSeats: number;
  reservedSeats: number;
  seats: SeatItem[];
};

export type MyReservation = {
  id: number;
  seatId: number;
  seatNumber: string;
  roomId: number;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

export type TimelineEntry = {
  hour: number;
  label: string;
  endLabel: string;
  status: string;
  userName: string | null;
  color: string | null;
  isMine: boolean;
};

export type WeeklyGrid = {
  hours: { hour: number; label: string }[];
  days: {
    index: number;
    label: string;
    blocks: {
      scheduleId: number;
      dayOfWeek: number;
      subjectName: string;
      startTime: string;
      endTime: string;
      location: string;
      dayLabel: string;
      topPct: number;
      heightPct: number;
      colorIndex: number;
    }[];
  }[];
  startHour: number;
  endHour: number;
  rowCount: number;
};

export type ScheduleItem = {
  id: number;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  location: string;
};

export type RecommendationSlot = {
  date: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  title: string;
  tag: string;
  afterSubject: string | null;
  comment: string;
  studyMethod: string;
  seatId: number;
  roomName: string;
  seatNumber: string;
};

export type RecommendationResult = {
  summary: string;
  studyTips: string;
  slots: RecommendationSlot[];
  llmUsed: boolean;
  llmStatus: string;
  scheduleSummary: string;
  grid: WeeklyGrid;
  hasSchedules: boolean;
  geminiConfigured: boolean;
};

export type ApiError = {
  message?: string;
  code?: string;
};
