// lib/ics/interview.ts

export type InterviewIcsPayload = {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  organizer: {
    name: string;
    email: string;
  };
  attendees: {
    name: string;
    email: string;
  }[];
  location?: string;
};

function formatDateToIcs(dt: Date): string {
  // Always convert to UTC for ICS
  const iso = dt.toISOString(); // 2025-12-04T21:00:00.000Z
  const basic = iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  // Now basic is like 20251204T210000Z
  return basic;
}

export function buildInterviewIcs(payload: InterviewIcsPayload): string {
  const uid = `thinkats-${Date.now()}@thinkats`;
  const dtStamp = formatDateToIcs(new Date());
  const dtStart = formatDateToIcs(payload.start);
  const dtEnd = formatDateToIcs(payload.end);

  const lines: string[] = [];

  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//ThinkATS//Interview//EN");
  lines.push("METHOD:REQUEST");
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`DTSTART:${dtStart}`);
  lines.push(`DTEND:${dtEnd}`);
  lines.push(`SUMMARY:${escapeText(payload.summary)}`);

  if (payload.description) {
    lines.push(`DESCRIPTION:${escapeText(payload.description)}`);
  }

  if (payload.location) {
    lines.push(`LOCATION:${escapeText(payload.location)}`);
  }

  if (payload.organizer?.email) {
    lines.push(
      `ORGANIZER;CN=${escapeText(
        payload.organizer.name || payload.organizer.email,
      )}:mailto:${payload.organizer.email}`,
    );
  }

  for (const attendee of payload.attendees || []) {
    if (!attendee.email) continue;
    lines.push(
      `ATTENDEE;CN=${escapeText(
        attendee.name || attendee.email,
      )}:mailto:${attendee.email}`,
    );
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n");
}
