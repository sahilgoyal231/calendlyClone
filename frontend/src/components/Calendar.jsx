import { useState, useMemo } from 'react';

export default function Calendar({ selectedDate, onSelectDate, availableDays = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        isDisabled: true
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const isPast = date < today;
      const isAvailableDay = availableDays.length === 0 || availableDays.includes(dayOfWeek);
      
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: isPast || !isAvailableDay,
        isToday: date.getTime() === today.getTime()
      });
    }

    // Next month leading days
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
        isDisabled: true
      });
    }

    return days;
  }, [viewDate, availableDays]);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isPrevDisabled = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() <= today.getMonth();

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="calendar-widget">
      <div className="calendar-nav">
        <span className="calendar-month-year">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <div className="calendar-nav-btns">
          <button className="calendar-nav-btn" onClick={goToPrevMonth} disabled={isPrevDisabled}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
        {calendarDays.map((day, idx) => {
          const dateKey = formatDateKey(day.date);
          const isSelected = selectedDate === dateKey;

          let className = 'calendar-day';
          if (!day.isCurrentMonth) className += ' other-month';
          if (day.isDisabled) className += ' disabled';
          if (day.isToday) className += ' today';
          if (isSelected) className += ' selected';

          return (
            <button
              key={idx}
              className={className}
              disabled={day.isDisabled}
              onClick={() => onSelectDate(dateKey)}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
