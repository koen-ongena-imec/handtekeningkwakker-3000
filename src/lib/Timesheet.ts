import type {PdfContent, TimesheetEntry} from "./parsers";
import {pipe} from "fp-ts/function";
import * as NEA from "fp-ts/NonEmptyArray";
import * as O from "fp-ts/Option";
import type {NonEmptyArray} from "fp-ts/NonEmptyArray";

export type SummaryEntry = {
    name: string;
    code: string;
    hours: number;
};

function sumHours(
    entries: Record<string, NonEmptyArray<TimesheetEntry>>
): Record<string, number> {
    const result: Record<string, number> = {};
    Object.entries(entries).forEach(([name, timesheetEntries]) => {
        result[name] = getTotalHours(timesheetEntries);
    });
    return result;
}

function getTotalHours(timesheetEntries: NonEmptyArray<TimesheetEntry>) {
    return timesheetEntries.reduce((sum, currentValue) => {
        return sum + currentValue.hours;
    }, 0);
}

const createSummaryEntries = (pdfContent: PdfContent) => (o: Record<string, number>): SummaryEntry[] => {
    return Object.entries(o).reduce((acc, [key, hours]) => {
        return [...acc, createSummaryEntry(key, hours)];
    }, [] as SummaryEntry[]);

    function createSummaryEntry(key: string, hours: number): SummaryEntry {
        const projectWithWbsRegexp = /(.+) - ([A-Z][\d_]+.*)/;
        if (projectWithWbsRegexp.test(key)) {
            const [_, name, code] = projectWithWbsRegexp.exec(key) || [];
            return {
                name: name,
                code: code,
                hours: hours,
            };
        } else {
            return {
                name: pdfContent.project.name || key,
                code: pdfContent.project.code || 'unknown',
                hours
            }
        }

    }
};


export function createSummary(pdfContent: PdfContent): SummaryEntry[] {
    return pipe(
        NEA.fromArray(pdfContent.timesheet),
        O.map(NEA.groupBy((tse: TimesheetEntry) => tse.name)),
        O.map(sumHours),
        O.map(createSummaryEntries(pdfContent)),
        O.getOrElse(() => [] as SummaryEntry[])
    );
}
