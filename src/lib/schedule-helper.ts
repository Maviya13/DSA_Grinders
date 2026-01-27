// Helper functions for managing message schedules

export function generateOptimalSchedule(messageCount: number, startHour: number = 9, endHour: number = 21): string[] {
  if (messageCount <= 0) return [];
  if (messageCount === 1) return [`${startHour.toString().padStart(2, '0')}:00`];
  
  const schedule: string[] = [];
  const totalHours = endHour - startHour;
  const interval = totalHours / (messageCount - 1);
  
  for (let i = 0; i < messageCount; i++) {
    const hour = Math.round(startHour + (interval * i));
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    schedule.push(timeString);
  }
  
  return schedule;
}

export function generateStaggeredSchedule(emailCount: number, whatsappCount: number): { emailSchedule: string[], whatsappSchedule: string[] } {
  const emailSchedule = generateOptimalSchedule(emailCount, 9, 21); // 9 AM to 9 PM
  const whatsappSchedule = generateOptimalSchedule(whatsappCount, 10, 22); // 10 AM to 10 PM (offset by 1 hour)
  
  return { emailSchedule, whatsappSchedule };
}

export function getScheduleDescription(schedule: string[]): string {
  if (schedule.length === 0) return "No messages scheduled";
  if (schedule.length === 1) return `Once daily at ${formatTime(schedule[0])}`;
  if (schedule.length === 2) return `Twice daily at ${formatTime(schedule[0])} and ${formatTime(schedule[1])}`;
  
  const times = schedule.map(formatTime);
  const lastTime = times.pop();
  return `${schedule.length} times daily: ${times.join(', ')} and ${lastTime}`;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
  return `${displayHour}:${minute} ${ampm}`;
}

// Predefined optimal schedules for common message counts
export const OPTIMAL_SCHEDULES = {
  1: {
    email: ["09:00"],
    whatsapp: ["09:30"]
  },
  2: {
    email: ["09:00", "17:00"],
    whatsapp: ["10:00", "18:00"]
  },
  3: {
    email: ["09:00", "14:00", "19:00"],
    whatsapp: ["10:00", "15:00", "20:00"]
  },
  4: {
    email: ["09:00", "13:00", "17:00", "21:00"],
    whatsapp: ["10:00", "14:00", "18:00", "22:00"]
  },
  5: {
    email: ["09:00", "12:00", "15:00", "18:00", "21:00"],
    whatsapp: ["10:00", "13:00", "16:00", "19:00", "22:00"]
  }
} as const;
