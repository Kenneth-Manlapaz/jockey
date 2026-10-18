import type { MeetingDay, Race } from '@/types';
import type { DTOMeeting } from './types';

function dateParts(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function toMeetingDay(meeting: DTOMeeting, races: Race[]): MeetingDay {
  const { year, month, day } = dateParts(meeting.race_date);
  const date = new Date(year, month - 1, day);
  return {
    date: meeting.race_date.slice(0, 10),
    day: String(day),
    weekday: date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase(),
    raceCount: meeting.race_count,
    races,
  };
}
