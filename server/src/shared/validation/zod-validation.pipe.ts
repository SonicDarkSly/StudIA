import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from './zod.js';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new BadRequestException(`Requête invalide. ${z.prettifyError(result.error)}`);
    return result.data;
  }
}
