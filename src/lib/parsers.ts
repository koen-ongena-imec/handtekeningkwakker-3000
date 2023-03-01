import {taskEither} from "fp-ts";

import * as TE from "fp-ts/TaskEither";
import type {Option} from "fp-ts/Option";
import * as O from "fp-ts/Option";

import {pipe} from "fp-ts/function";
import * as A from "fp-ts/Array";
import {filter, findIndex, sortBy} from "fp-ts/Array";

import * as Ord from "fp-ts/Ord";
import {PDFDocument, PDFImage} from "pdf-lib";
import fs from "fs";
import {format} from "date-fns";
import type {NonEmptyArray} from "fp-ts/NonEmptyArray";
import path from "path";

import type {TextItem} from "pdfjs-dist/types/src/display/api";
import type {PDFDocumentProxy, PDFPageProxy} from "pdfjs-dist";
import {getPeriodForDate, parseFirstDayOfTheMonth, parseMonthYearToPeriod} from "./dates";

function transformBasedOrdering(transformIndex: number) {
    return Ord.fromCompare((t1: TextItem, t2: TextItem) => {
        const x1 = t1.transform[transformIndex];
        const x2 = t2.transform[transformIndex];
        if (Math.abs(x1 - x2) < 5) {
            return 0;
        } else if (Math.round(x1) < Math.round(x2)) {
            return -1;
        }
        return 1;
    });
}

const sortTopToBottom: Ord.Ord<TextItem> = pipe(
    transformBasedOrdering(5),
    Ord.reverse
);
const sortLeftToRight: Ord.Ord<TextItem> = pipe(transformBasedOrdering(4));
const hasWidth = (i: TextItem) => i.height > 0 && i.width > 0;
const sortItemsLeftToRight = (items: TextItem[]) => {
    return pipe(
        items,
        filter(hasWidth),
        sortBy([sortTopToBottom, sortLeftToRight])
    );
};
type PdfSrc = Uint8Array;

const getDocument = (src: PdfSrc) =>
    taskEither.tryCatch<Error, PDFDocumentProxy>(
        async () => {
            const pdfJs = await import('pdfjs-dist/build/pdf');
            pdfJs.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.entry');

            return pdfJs.getDocument(src).promise;
        },
        (error) => new Error(String(error))
    );
const getPage = (page: number) => (doc: PDFDocumentProxy) =>
    taskEither.tryCatch(
        () => doc.getPage(page),
        (reason) => new Error(String(reason))
    );
const getTextContent = (page: PDFPageProxy) =>
    taskEither.tryCatch(
        () => {
            return page.getTextContent({
                disableCombineTextItems: false,
                includeMarkedContent: false,
            });
        },
        (reason) => new Error(String(reason))
    );

function friendlyName(s: string) {
    const [lastName, firstName] = s.split(", ");
    return firstName + " " + lastName;
}

function nextItem(textItems: TextItem[]) {
    return (i: number) => {
        if (i + 1 >= textItems.length) {
            return O.none;
        }
        return O.some(textItems[i + 1]);
    };
}

function getTextItemValueAfter(label: string) {
    return function (textItems: TextItem[]) {
        return pipe(
            textItems,
            findIndex((ti) => ti.str === label),
            O.chain(nextItem(textItems)),
            O.map((ti) => ti.str)
        );
    };
}

function extractName(textItems: TextItem[]) {
    return pipe(
        textItems,
        getTextItemValueAfter("Name & PO No."),
        O.map(friendlyName),
        O.getOrElse(() => "Invalid name")
    );
}

function buildOutputExcelFileName(
    data: ExcelContent,
    excelConfig: ExcelConfig
) {
    const prefix = format(new Date(), "yyyy-MM");
    return path.join(
        excelConfig.outputFolder,
        `${prefix} Timesheet flexforce  - ${data.nameOfTheConsultant}.xlsx`
    );
}


export type TimesheetEntry = {
    day: string;
    name: string;
    hours: number;
};
export type ExcelContent = {
    period: string;
    nameOfTheConsultant: string;
    companyName: string;
    timesheet: TimesheetEntry[];
};

export type PdfContent = {
    period: string;
    nameOfTheConsultant: string;
    companyName: string;
    yearMonth: string;
    project: { name: string; code?: string };
    timesheet: TimesheetEntry[];
};

function extractPeriod(textItems: TextItem[]) {
    return pipe(
        textItems,
        getTextItemValueAfter("Month/Year"),
        O.chain(parseMonthYearToPeriod),
        O.getOrElse(() => getPeriodForDate(new Date()))
    );
}

function extractTimesheet(textItems: TextItem[]) {
    const qtyIndex = findIndex((a: TextItem) => a.str === "Qty.")(textItems);
    if (O.isSome(qtyIndex)) {
        let currIndex = qtyIndex.value + 1;
        const entries = [];
        while (textItems[currIndex].str !== "Total Hours") {
            entries.push({
                day: textItems[currIndex].str,
                name: textItems[currIndex + 1].str,
                hours: parseFloat(textItems[currIndex + 2].str),
            });
            currIndex += 3;
        }
        return entries;
    }

    return [];
}

function parseProjectName(s: string) {
    const wbsCodeRegexp = /.*([A-Z][\d_]+):?( ?.*)?/;
    if (wbsCodeRegexp.test(s)) {
        const [_, code, name] = wbsCodeRegexp.exec(s) || [];
        return {name: (name || '').trim(), code};
    }

    return {name: s, code: undefined};
}


function extractProject(textItems: TextItem[]): {
    code?: string;
    name: string;
} {
    const handleNoProjectNameFound = () => {
        return {name: "Invalid project name"};
    };
    return pipe(
        textItems,
        getTextItemValueAfter("Project name"),
        O.fold(handleNoProjectNameFound, parseProjectName)
    );
}

function extractFirstDayOfMonth(textItems: TextItem[]): Date {
    return pipe(
        textItems,
        getTextItemValueAfter("Month/Year"),
        O.chain(parseFirstDayOfTheMonth),
        O.getOrElse(() => new Date())
    );
}

function extractData(textItems: TextItem[]): PdfContent {
    return {
        nameOfTheConsultant: extractName(textItems),
        companyName: "Tobania (host) / Codifly (employer)",
        period: extractPeriod(textItems),
        yearMonth: format(extractFirstDayOfMonth(textItems), 'yyyy-MM'),
        timesheet: extractTimesheet(textItems),
        project: extractProject(textItems),
    };
}

function extractFirstPageTextItems(
    pdfSrc: PdfSrc | Uint8Array
): TE.TaskEither<Error, TextItem[]> {
    return pipe(
        getDocument(pdfSrc),
        TE.chain((doc) => getPage(1)(doc)),
        TE.chain((page) => getTextContent(page)),
        TE.map((textContent) => textContent.items as TextItem[])
    );
}

export function extractDataFromUint8Array(
    array: Uint8Array
): TE.TaskEither<Error, PdfContent> {
    return pipe(
        array,
        extractFirstPageTextItems,
        TE.map(sortItemsLeftToRight),
        TE.map(extractData)
    );
}

export function findCustomerSignatureLabelPosition(
    pdfSrc: PdfSrc
): TE.TaskEither<Error, Option<XY>> {
    return pipe(
        pdfSrc,
        extractFirstPageTextItems,
        TE.map(A.findFirst((a: TextItem) => a.str === "Signature customer")),
        TE.map(
            O.map((te: TextItem) => {
                const [_0, _1, _2, _3, x, y] = te.transform;
                return {x, y};
            })
        )
    );
}

function getTotalHours(timesheetEntries: NonEmptyArray<TimesheetEntry>) {
    return timesheetEntries.reduce((sum, currentValue) => {
        return sum + currentValue.hours;
    }, 0);
}

function sumHours(
    entries: Record<string, NonEmptyArray<TimesheetEntry>>
): Record<string, number> {
    const result: Record<string, number> = {};
    Object.entries(entries).forEach(([name, timesheetEntries]) => {
        result[name] = getTotalHours(timesheetEntries);
    });
    return result;
}

type SummaryEntry = {
    name: string;
    code: string;
    hours: number;
};

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


type ExcelConfig = { template: string; manager: string; outputFolder: string };

function resizeImage(image: PDFImage, targetHeight: number) {
    const aspectRatio = targetHeight / image.height;
    const targetWidth = image.width * aspectRatio;

    return {width: targetWidth, height: targetHeight};
}

async function embedImage(signatureFilePath: string, pdfDoc: PDFDocument) {
    const imageBytes = fs.readFileSync(signatureFilePath);
    if (signatureFilePath.toLowerCase().endsWith(".jpg")) {
        return await pdfDoc.embedJpg(imageBytes);
    }
    return await pdfDoc.embedPng(imageBytes);
}

type XY = { x: number; y: number };

function buildSignedPdfOutputPath(
    pdfFilePath: string,
    options: SignedPdfOptions
) {
    let s = path.basename(pdfFilePath.replace(".pdf", " - signed.pdf"));
    return path.join(options.outputFolder, s);
}

const addSignatureOnXY = (
    pdfFilePath: string,
    signatureFilePath: string,
    options: SignedPdfOptions
) => {
    const {manager} = options;
    const outputPdfFilePath = buildSignedPdfOutputPath(pdfFilePath, options);

    // TODO this needs cleaning up :/
    return (xy: XY) =>
        TE.tryCatch(
            () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfFilePath));
                        const firstPage = pdfDoc.getPage(0);

                        const image = await embedImage(signatureFilePath, pdfDoc);
                        const imageTargetHeight = 50;
                        const {height, width} = resizeImage(image, imageTargetHeight);

                        // Draw the image on the page
                        firstPage.drawImage(image, {
                            x: xy.x,
                            y: xy.y + imageTargetHeight - 20,
                            width,
                            height,
                        });

                        firstPage.drawText(
                            format(new Date(), "yyyy-MM-dd") + " " + manager,
                            {
                                x: xy.x,
                                y: xy.y + 19,
                                size: 8,
                            }
                        );

                        const newFileBytes = await pdfDoc.save();
                        fs.writeFileSync(outputPdfFilePath, newFileBytes);

                        resolve(newFileBytes);
                    } catch (e) {
                        reject(e);
                    }
                });
            },
            (reason) => {
                return new Error(String(reason));
            }
        );
};

type SignedPdfOptions = {
    signature: string;
    manager: string;
    outputFolder: string;
};
