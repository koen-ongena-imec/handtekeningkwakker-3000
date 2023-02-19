import {writable} from 'svelte/store';
import type {PdfContent, TimesheetEntry} from "./parsers";

export const pdfContent = writable<PdfContent>({
    companyName: "",
    nameOfTheConsultant: "",
    project: {
        code: "", name: ""

    },
    period: '',
    timesheet: [] as TimesheetEntry[]
});

export const pdf = writable<Uint8Array>(new Uint8Array(0));
export const signature = writable<Uint8Array>(new Uint8Array(0));