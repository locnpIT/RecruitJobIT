export const isDateRangeInvalid = (from?: string, to?: string) => {
  if (!from || !to) {
    return false;
  }
  // Inputs come from <input type="date"> => YYYY-MM-DD, safe to compare lexicographically.
  return from > to;
};
