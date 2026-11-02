import { z } from 'zod';

const MODEL_KEY = /^[a-z0-9][a-z0-9.-]{0,63}$/;

export const modelKeySchema = z.string().regex(MODEL_KEY, { message: 'Clé de modèle invalide' });
