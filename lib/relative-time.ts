const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const MIN = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diff);
  if (abs < MIN) return rtf.format(diff, "second");
  if (abs < HOUR) return rtf.format(Math.round(diff / MIN), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / HOUR), "hour");
  if (abs < WEEK) return rtf.format(Math.round(diff / DAY), "day");
  if (abs < MONTH) return rtf.format(Math.round(diff / WEEK), "week");
  if (abs < YEAR) return rtf.format(Math.round(diff / MONTH), "month");
  return rtf.format(Math.round(diff / YEAR), "year");
}
