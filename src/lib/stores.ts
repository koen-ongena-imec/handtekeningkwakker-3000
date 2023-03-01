import {writable} from 'svelte/store';
import type {PdfContent, TimesheetEntry} from "./parsers";

export type UploadedFile = { bytes: Uint8Array, name: string };

let EMPTY_PDF_CONTENT: PdfContent = {
    companyName: "",
    nameOfTheConsultant: "",
    project: {
        code: "", name: ""

    },
    period: '',
    yearMonth: '',
    timesheet: [] as TimesheetEntry[]
};

export const pdfContentStore = (() => {
    const {subscribe, set, update} = writable<PdfContent>(EMPTY_PDF_CONTENT);

    const updateName = (name: string) => {
        update((pdfContent) => {
            pdfContent.nameOfTheConsultant = name;
            return pdfContent;
        });
    }
    const updateCompanyName = (name: string) => {
        update((pdfContent) => {
            pdfContent.companyName = name;
            return pdfContent;
        });
    }
    return {
        updateName,
        updateCompanyName,
        subscribe,
        update,
        set,
        get: (): PdfContent => this,
        reset: () => set(EMPTY_PDF_CONTENT)
    };
})();

const EMPTY_FILE = {bytes: new Uint8Array(0), name: ""};
const initialExcelData = {manager: "Your signing name ", signingDate: new Date().toLocaleDateString()};
export const signingData = writable<{ manager: string; signingDate: string }>(initialExcelData);
export const pdf = writable<UploadedFile>(EMPTY_FILE);
export const signature = writable<UploadedFile>(EMPTY_FILE);
export const excelTemplate = writable<UploadedFile>(EMPTY_FILE);