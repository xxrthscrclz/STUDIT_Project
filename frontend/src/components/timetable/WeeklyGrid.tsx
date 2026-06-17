import type { WeeklyGrid as WeeklyGridType } from '@/api/types';

const BLOCK_STYLES = [
  { bg: 'var(--color-block-0-bg)', border: 'var(--color-block-0-border)' },
  { bg: 'var(--color-block-1-bg)', border: 'var(--color-block-1-border)' },
  { bg: 'var(--color-block-2-bg)', border: 'var(--color-block-2-border)' },
  { bg: 'var(--color-block-3-bg)', border: 'var(--color-block-3-border)' },
  { bg: 'var(--color-block-4-bg)', border: 'var(--color-block-4-border)' },
  { bg: 'var(--color-block-5-bg)', border: 'var(--color-block-5-border)' },
];

type Props = {
  grid: WeeklyGridType;
  compact?: boolean;
  className?: string;
};

export function WeeklyGrid({ grid, compact, className }: Props) {
  const rowHeight = compact ? 40 : 56;

  // 과목명별 색상 인덱스 매핑 (같은 과목 = 같은 색)
  const subjectColorMap = new Map<string, number>();
  let colorCounter = 0;

  for (const day of grid.days) {
    for (const block of day.blocks) {
      if (!subjectColorMap.has(block.subjectName)) {
        subjectColorMap.set(block.subjectName, colorCounter);
        colorCounter++;
      }
    }
  }

  return (
    <div className={`animate-fade-in overflow-x-auto rounded-[16px] border border-border bg-bg-card ${className ?? ''}`}>
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `56px repeat(${grid.days.length}, 1fr)` }}
      >
        <div className="border-b border-r border-border-muted bg-bg-muted p-2 text-xs text-text-muted">
          시간
        </div>
        {grid.days.map((day) => (
          <div
            key={day.index}
            className="border-b border-r border-border-muted bg-bg-muted p-2 text-center text-sm font-medium text-text-primary"
          >
            {day.label}
          </div>
        ))}

        <div className="relative border-r border-border-muted">
          {grid.hours.map((hour) => (
            <div
              key={hour.hour}
              className="border-b border-border-muted px-2 text-xs text-text-muted"
              style={{ height: rowHeight }}
            >
              {hour.label}
            </div>
          ))}
        </div>

        {grid.days.map((day) => (
          <div
            key={day.index}
            className="relative border-r border-border-muted"
            style={{ height: grid.rowCount * rowHeight }}
          >
            {grid.hours.map((hour) => (
              <div
                key={hour.hour}
                className="absolute left-0 right-0 border-b border-border-muted"
                style={{ top: (hour.hour - grid.startHour) * rowHeight, height: rowHeight }}
              />
            ))}
            {day.blocks.map((block, blockIndex) => {
              const colorIndex = subjectColorMap.get(block.subjectName) ?? 0;
              const style = BLOCK_STYLES[colorIndex % BLOCK_STYLES.length];
              return (
                <div
                  key={block.scheduleId}
                  className="absolute left-1 right-1 overflow-hidden rounded-[8px] border-l-[3px] px-2 py-1 text-xs shadow-sm transition-all duration-200 hover:shadow-md animate-scale-in"
                  style={{
                    top: `${block.topPct}%`,
                    height: `${block.heightPct}%`,
                    backgroundColor: style.bg,
                    borderLeftColor: style.border,
                    animationDelay: `${blockIndex * 0.05}s`,
                  }}
                  title={`${block.subjectName} ${block.startTime}~${block.endTime}`}
                >
                  <div className="font-semibold text-text-primary truncate">{block.subjectName}</div>
                  <div className="text-text-secondary truncate">
                    {block.startTime}~{block.endTime}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
