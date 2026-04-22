export function parseDurationToMs(value: string): number {
  if (!value) {
    throw new Error('Duration is required (e.g. "7d", "10h")');
  }

  const match = value.match(/^(\d+)([dhms])$/);

  if (!match) {
    throw new Error('Invalid duration format. Use formats like "7d", "10h"');
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 's':
      return amount * 1000;
    default:
      throw new Error(`Unsupported duration unit: "${unit}"`);
  }
}
