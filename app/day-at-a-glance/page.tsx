'use client';

import { useState, useEffect } from 'react';
import './styles.css';

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#a855f7',
  yellow: '#f59e0b',
  pink: '#ec4899',
  green: '#22c55e',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
};

const events = [
  {
    hour: 9,
    title: 'Team Standup',
    time: '09:00 – 10:00 (1 hr)',
    color: 'blue',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    hour: 10,
    title: 'Deep Work',
    time: '10:00 – 11:00 (1 hr)',
    color: 'purple',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    hour: 11,
    title: 'Sprint Planning',
    time: '11:00 – 12:00 (1 hr)',
    color: 'indigo',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
  {
    hour: 12,
    title: 'Lunch Break',
    time: '12:00 – 13:00 (1 hr)',
    color: 'yellow',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      </svg>
    ),
  },
  {
    hour: 13,
    title: 'Design Review',
    time: '13:00 – 14:00 (1 hr)',
    color: 'pink',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    hour: 14,
    title: 'Documentation',
    time: '14:00 – 15:00 (1 hr)',
    color: 'orange',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    hour: 15,
    title: 'Client Call',
    time: '15:00 – 16:00 (1 hr)',
    color: 'green',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    hour: 16,
    title: 'Code Review',
    time: '16:00 – 17:00 (1 hr)',
    color: 'teal',
    icon: (
      <svg viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

export default function DayAtAGlance() {
  const [checkboxes, setCheckboxes] = useState<Record<number, boolean>>({});
  const [nowPosition, setNowPosition] = useState<number | null>(null);
  const [currentHour, setCurrentHour] = useState<number>(-1);
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      setCurrentHour(hour);
      setCurrentMinute(minute);

      if (hour >= 9 && hour < 17) {
        setNowPosition((hour - 9) * 100 + (minute / 60) * 100 + 2);
      } else {
        setNowPosition(null);
      }
    };

    setTodayDate(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleCheckbox = (index: number) => {
    setCheckboxes(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="day-container">
      <header>
        <h1>Your day at<br />a glance</h1>
        <p className="subtitle">Easily view your scheduled time blocks<br />in a clean and efficient timeline format.</p>
        {todayDate && <p className="today-date">{todayDate}</p>}
      </header>

      <div className="timeline">
        {events.map((event, i) => {
          const isPast = event.hour < currentHour;
          const isCurrent = event.hour === currentHour;
          const fillPct = Math.round((currentMinute / 60) * 100);
          const hex = COLOR_MAP[event.color] || '#444';

          const barStyle = isCurrent
            ? {
                background: `linear-gradient(to bottom, rgba(68, 68, 68, 0.95) ${fillPct}%, ${hex} ${fillPct}%)`,
              }
            : undefined;

          return (
            <div key={event.hour} className={`hour-row ${isPast ? 'past' : ''}`}>
              <div className="hour-col">
                <span className="hour-num">{String(event.hour).padStart(2, '0')}</span>
              </div>
              <div className="bar-col">
                <div
                  className={`event-bar ${isPast ? 'past' : isCurrent ? '' : event.color}`}
                  style={barStyle}
                >
                  {event.icon}
                </div>
              </div>
              <div className="card-col">
                <div className="event-card">
                  <div className="event-details">
                    <div className="event-title">{event.title}</div>
                    <div className="event-time">{event.time}</div>
                  </div>
                  <div
                    role="checkbox"
                    aria-checked={!!checkboxes[i]}
                    tabIndex={0}
                    className={`checkbox ${event.color} ${checkboxes[i] ? 'checked' : ''}`}
                    onClick={() => toggleCheckbox(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCheckbox(i);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {nowPosition !== null && (
          <div className="now-line" style={{ top: `${nowPosition}px` }} />
        )}
      </div>
    </div>
  );
}
