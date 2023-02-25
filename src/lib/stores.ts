import {writable} from 'svelte/store';
import type {PdfContent, TimesheetEntry} from "./parsers";

export type UploadedFile = { bytes: Uint8Array, name: string };

export const pdfContent = writable<PdfContent>({
    companyName: "",
    nameOfTheConsultant: "",
    project: {
        code: "", name: ""

    },
    period: '',
    timesheet: [] as TimesheetEntry[]
});
const EMPTY_FILE = {bytes: new Uint8Array(0), name: ""};
export const pdf = writable<UploadedFile>(EMPTY_FILE);
export const signature = writable<UploadedFile>(EMPTY_FILE);
export const excelTemplate = writable<UploadedFile>(EMPTY_FILE);