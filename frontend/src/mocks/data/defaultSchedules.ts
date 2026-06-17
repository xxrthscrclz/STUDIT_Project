import type { ScheduleItem } from '@/api/types';

/**
 * 목·시드용 원본. days는 요일 인덱스 배열.
 * 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토 (Date.getDay()와 동일)
 */
export type DemoScheduleSource = {
  subjectName: string;
  days: number[];
  startTime: string;
  endTime: string;
  location: string;
};

/** API·그리드용 (0=월 … 6=일) */
const API_DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

/** 소스 인덱스(일=0) → API dayOfWeek(월=0) */
function sourceDayToApiDay(sourceDay: number): number | null {
  if (sourceDay < 0 || sourceDay > 6) {
    return null;
  }
  return sourceDay === 0 ? 6 : sourceDay - 1;
}

export const DEMO_SCHEDULE_SOURCES: DemoScheduleSource[] = [
  {
    subjectName: '문학속의심리학',
    days: [1],
    startTime: '10:00',
    endTime: '13:30',
    location: '북악관 604호',
  },
  {
    subjectName: '글로벌미디어문화와영화영어',
    days: [1],
    startTime: '15:00',
    endTime: '18:00',
    location: '북악관 706호',
  },
  {
    subjectName: '웹클라이언트컴퓨팅',
    days: [2, 4],
    startTime: '12:00',
    endTime: '13:30',
    location: '미래관 447호',
  },
  {
    subjectName: '소프트웨어프로젝트 I',
    days: [2, 4],
    startTime: '13:30',
    endTime: '15:00',
    location: '미래관 424호',
  },
  {
    subjectName: '웹서버컴퓨팅',
    days: [2, 4],
    startTime: '15:00',
    endTime: '16:30',
    location: '미래관 445호',
  },
  {
    subjectName: '다학제간캡스톤디자인',
    days: [5],
    startTime: '12:00',
    endTime: '15:00',
    location: '미래관 424호',
  },
];

/** days 배열 → 요일별 ScheduleItem */
export function expandDemoSchedules(
  sources: DemoScheduleSource[],
  nextId: () => number,
): ScheduleItem[] {
  const items: ScheduleItem[] = [];

  for (const source of sources) {
    for (const sourceDay of source.days) {
      const dayOfWeek = sourceDayToApiDay(sourceDay);
      if (dayOfWeek === null) {
        continue;
      }
      items.push({
        id: nextId(),
        dayOfWeek,
        dayLabel: API_DAY_LABELS[dayOfWeek],
        startTime: source.startTime,
        endTime: source.endTime,
        subjectName: source.subjectName,
        location: source.location,
      });
    }
  }

  return items;
}
