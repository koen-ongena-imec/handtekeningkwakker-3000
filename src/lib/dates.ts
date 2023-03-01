import * as O from "fp-ts/Option";
import * as dates from "date-fns";

function formatPeriod(firstDayOfMonth: Date, lastDayOfMonth: Date) {
  function formatDate(date: Date) {
    return dates.format(date, "dd/MM/yyyy");
  }

  return `${formatDate(firstDayOfMonth)} - ${formatDate(lastDayOfMonth)}`;
}

export function parseFirstDayOfTheMonth(s: string): O.Option<Date> {
  try {
    const firstDayOfMonth: Date = dates.parse(s, "MM/yyyy", new Date());
    return O.some(firstDayOfMonth);
  } catch (e) {
    return O.none;
  }
}
export function parseMonthYearToPeriod(s: string): O.Option<string> {
  const firstDayOfTheMonth = parseFirstDayOfTheMonth(s);
  console.log(firstDayOfTheMonth);
  if (O.isSome(firstDayOfTheMonth)) {
    const lastDayOfTheMonth = dates.lastDayOfMonth(firstDayOfTheMonth.value);
    return O.some(formatPeriod(firstDayOfTheMonth.value, lastDayOfTheMonth));
  } else {
    return O.none;
  }
}

export function getPeriodForDate(date: Date) {
  const firstDayOfTheMonth = dates.setDate(date, 1);
  const lastDayOfTheMonth = dates.lastDayOfMonth(date);
  return formatPeriod(firstDayOfTheMonth, lastDayOfTheMonth);
}
