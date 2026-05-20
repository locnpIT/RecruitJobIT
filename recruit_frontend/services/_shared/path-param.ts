export function requirePathParam(value: string | number, fieldName: string): string | number {
  // Chặn path param rỗng/"undefined"/"null" để tránh bắn request URL sai.
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} không hợp lệ.`);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null") {
      throw new Error(`${fieldName} không hợp lệ.`);
    }
    return trimmed;
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} không hợp lệ.`);
  }

  return value;
}
