// A calendar date has no timezone. Only timestamps should be parsed as instants.
export function parseLocalDate(value: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}
