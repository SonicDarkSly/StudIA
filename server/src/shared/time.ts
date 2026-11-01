import { MS_PER_SECOND } from './consts.js';

export const secondsSince = (start: number, end: number = Date.now()): number =>
  (end - start) / MS_PER_SECOND;
