const JSON_INDENT = 2;

export const toPrettyJson = (value: unknown): string => JSON.stringify(value, null, JSON_INDENT);
