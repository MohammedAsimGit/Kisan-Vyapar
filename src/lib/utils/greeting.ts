export type Greeting = "Good morning" | "Good afternoon" | "Good evening";

export function greetingForHour(hour: number): Greeting {
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}
