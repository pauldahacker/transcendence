export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals: [number, string][] = [
    [60, "s"],
    [60, "min"],
    [24, "h"],
    [7, "d"],
    [4.34524, "w"],
    [12, "m"],
    [Infinity, "y"],
  ];

  let value = seconds;
  let unit = "s";

  for (let i = 0; i < intervals.length - 1; i++) {
    if (value < intervals[i][0]) break;
    value /= intervals[i][0];
    unit = intervals[i + 1][1];
  }

  value = Math.floor(value);
  return `${value} ${unit} ago`;
}