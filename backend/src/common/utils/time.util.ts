export function getISTDate(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST offset in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + istOffset * 60000);
}

export function getISTStartOfDay(): Date {
  const ist = getISTDate();
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export function getISTEndOfDay(): Date {
  const ist = getISTDate();
  ist.setHours(23, 59, 59, 999);
  return ist;
}