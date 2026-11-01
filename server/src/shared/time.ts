export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60_000;

export const secondsSince = (start: number, end: number = Date.now()): number =>
  (end - start) / MS_PER_SECOND;
