import * as O from "fp-ts/Option";
import * as dates from "date-fns";

function formatPeriod(firstDayOfMonth: Date, lastDayOfMonth: Date) {
  function formatDate(date: Date) {
    return dates.format(date, "dd/MM/yyyy");
  }

  return `${formatDate(firstDayOfMonth)} - ${formatDate(lastDayOfMonth)}`;
}

export function parseMonthYearToPeriod(s: string): O.Option<string> {
  try {
    const firstDayOfMonth: Date = dates.parse(s, "MM/yyyy", new Date());
    const lastDayOfMonth: Date = dates.lastDayOfMonth(firstDayOfMonth);

    return O.some(formatPeriod(firstDayOfMonth, lastDayOfMonth));
  } catch (e) {
    return O.none;
  }
}

export function getPeriodForDate(date: Date) {
  const firstDayOfTheMonth = dates.setDate(date, 1);
  const lastDayOfTheMonth = dates.lastDayOfMonth(date);
  return formatPeriod(firstDayOfTheMonth, lastDayOfTheMonth);
}
