export type TrendRangeDays = 7 | 30 | 90;

export const TREND_RANGE_OPTIONS: Array<{ label: string; value: TrendRangeDays }> = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
];

export function buildDailyTrendChart(dateValues: Array<string | null>, spanDays: TrendRangeDays) {
  const labels: string[] = [];
  const values: number[] = [];
  const today = new Date();

  for (let index = spanDays - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const key = formatLocalDateKey(day);
    labels.push(day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
    values.push(dateValues.filter((value) => value && formatLocalDateKey(new Date(value)) === key).length);
  }

  return {
    labels,
    values,
    colors: ["#008080"],
  };
}

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
