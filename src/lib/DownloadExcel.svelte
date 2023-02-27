<script lang="ts">
    import type {UploadedFile} from "./stores";
    import {excelTemplate as excelTemplateStore, pdf, pdfContentStore, signingData} from "./stores";
    import {createSummary} from "./Timesheet";
    import * as TE from "fp-ts/lib/TaskEither";
    import * as Excel from "exceljs";
    import {format} from "date-fns";
    import {pipe} from "fp-ts/function";

    const manager = ' ME '
    let excelTemplate: UploadedFile;
    excelTemplateStore.subscribe(value => {
        excelTemplate = value;
    });

    let excelContent;
    pdfContentStore.subscribe(value => {
        excelContent = {
            ...value,
            summary: createSummary(value),
        }
    });
    let signingContent;
    signingData.subscribe(value => {
        signingContent = value;
        return value;
    });

    let excelOutputName: string;
    pdf.subscribe(value => {
        excelOutputName = value?.name?.replace(/\.pdf$/, '.xlsx') || '';
    });

    function readExcelFile(data: Uint8Array): TE.TaskEither<Error, Excel.Workbook> {
        return TE.tryCatch(
            () => {
                const workbook = new Excel.Workbook();
                return workbook.xlsx.load(data);
            },
            (reason) => {
                return new Error(String(reason));
            }
        );
    }

    function handleError(err: Error) {
        console.log(err.message);
        return TE.of(err.message);
    }

    function updateWorkbook(workbook, data, signingContent) {
        const worksheet = workbook.getWorksheet(1);
        worksheet.getCell("B2").value = data.nameOfTheConsultant;
        worksheet.getCell("B3").value = data.companyName;
        worksheet.getCell("B7").value = data.period;

        const {summary} = data;

        summary.forEach((s, index) => {
            const rowNumber = 10 + index;
            worksheet.getCell(
                "A" + rowNumber
            ).value = `Project name: ${s.name}\nProject code: ${s.code}`;
            worksheet.getCell("B" + rowNumber).value = {
                formula: `=${s.hours}/8`,
                date1904: false,
            };
        });

        worksheet.getCell("B20").value = {
            formula: "=SUM(B10:B18)",
            date1904: false,
        };

        worksheet.getCell("B22").value = signingContent.manager;
        worksheet.getCell("B23").value = signingContent.signingDate;
    }

    function presentAsDownload(workbook) {
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = excelOutputName;
            link.click();
            URL.revokeObjectURL(link.href);
        });
    }

    function download(bytes: Uint8Array) {
        const data = excelContent;
        return pipe(
            readExcelFile(bytes),
            TE.fold(handleError, (workbook) => {
                updateWorkbook(workbook, data, signingContent);
                presentAsDownload(workbook);
                return TE.of("Hooray");
            })
        )();
    }

    function downloadExcel() {
        if (!excelContent) {
            return;
        }

        if (!excelTemplate.name) {
            fetch("/template.xlsx")
                .then((response) => response.arrayBuffer())
                .then((buffer) => {
                    download(new Uint8Array(buffer));
                });
        } else {
            download(excelTemplate.bytes);
        }
    }

    $: disabled = !excelOutputName;
</script>

<button disabled={disabled} on:click={downloadExcel} type="button"
        class={ disabled ? "inline-flex text-white bg-blue-400 dark:bg-blue-500 cursor-not-allowed font-medium rounded-lg text-sm px-5 py-2.5 text-center" : "text-white bg-[#2557D6] hover:bg-[#2557D6]/90 focus:ring-4 focus:ring-[#2557D6]/50 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#2557D6]/50 mr-2 mb-2"}>
    <svg class="w-6 h-6 mr-2 -ml-1" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
              stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
    Download excel
</button>