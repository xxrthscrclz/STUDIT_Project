import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('ko', ko);

type DatePickerProps = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: string;
  className?: string;
};

export function DatePicker({ value, onChange, minDate, className = '' }: DatePickerProps) {
  const dateValue = value ? new Date(value + 'T00:00:00') : null;
  const minDateValue = minDate ? new Date(minDate + 'T00:00:00') : undefined;

  return (
    <ReactDatePicker
      selected={dateValue}
      onChange={(date: Date | null) => {
        if (date) {
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          onChange(`${yyyy}-${mm}-${dd}`);
        }
      }}
      minDate={minDateValue}
      locale="ko"
      dateFormat="yyyy. MM. dd."
      placeholderText="날짜 선택"
      className={`
        w-full rounded-[12px] border border-border bg-bg-card px-4 py-3 text-sm text-text-primary
        placeholder:text-text-muted cursor-pointer
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
        ${className}
      `}
      calendarClassName="studit-calendar"
      showPopperArrow={false}
      popperPlacement="bottom-start"
      portalId="datepicker-portal"
    />
  );
}

type TimePickerProps = {
  value: string; // HH:mm
  onChange: (value: string) => void;
  className?: string;
};

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [hours, minutes] = value ? value.split(':').map(Number) : [9, 0];
  const dateValue = new Date();
  dateValue.setHours(hours, minutes, 0, 0);

  return (
    <ReactDatePicker
      selected={dateValue}
      onChange={(date: Date | null) => {
        if (date) {
          const hh = String(date.getHours()).padStart(2, '0');
          const mm = String(date.getMinutes()).padStart(2, '0');
          onChange(`${hh}:${mm}`);
        }
      }}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={30}
      timeCaption="시간"
      dateFormat="HH:mm"
      locale="ko"
      placeholderText="시간 선택"
      className={`
        w-full rounded-[12px] border border-border bg-bg-card px-4 py-3 text-sm text-text-primary
        placeholder:text-text-muted cursor-pointer
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
        ${className}
      `}
      calendarClassName="studit-calendar"
      showPopperArrow={false}
      popperPlacement="bottom-start"
      portalId="datepicker-portal"
    />
  );
}
