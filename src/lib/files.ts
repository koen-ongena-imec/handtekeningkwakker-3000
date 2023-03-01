import type {PdfContent} from "./parsers";

const buildBaseFilename = (extension: string) => (pdfContent1: PdfContent) => `${pdfContent1.yearMonth} -Timesheet flexforce - ${pdfContent1.nameOfTheConsultant} (${pdfContent1.companyName}) - signed.${extension}`;

export const buildSignedPdfFileName: (pdfContent: PdfContent) => string = buildBaseFilename('.pdf');
export const buildSignedExcelFileName: (pdfContent: PdfContent) => string = buildBaseFilename('.xlsx');