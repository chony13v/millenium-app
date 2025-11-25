type DateParts = {
  date: string;
  hour: number;
  weekday: number;
};

function toDateInstance(ts: Date | number): Date {
  if (ts === null || ts === undefined) {
    throw new Error('timestamp is required');
  }

  if (ts instanceof Date) {
    if (Number.isNaN(ts.getTime())) {
      throw new Error('timestamp Date is invalid');
    }
    return ts;
  }

  if (typeof ts !== 'number') {
    throw new Error('timestamp must be a Date or number');
  }

  if (!Number.isFinite(ts)) {
    throw new Error('timestamp must be a finite number');
  }

  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    throw new Error('timestamp number is invalid');
  }

  return date;
}

/**
 * Break a timestamp down into date parts using UTC components.
 */
export function toDateParts(ts: Date | number): DateParts {
  const date = toDateInstance(ts);
  const iso = date.toISOString();
  const dateOnly = iso.split('T')[0];

  return {
    date: dateOnly,
    hour: date.getUTCHours(),
    weekday: date.getUTCDay(),
  };
}