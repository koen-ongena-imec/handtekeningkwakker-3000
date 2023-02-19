<script lang="ts">
    import {excelTemplate, pdfContent} from "./stores";
    import {createSummary} from "./Timesheet";
    import * as TE from "fp-ts/lib/TaskEither";
    import * as Excel from "exceljs";
    import {format} from "date-fns";
    import {pipe} from "fp-ts/function";

    const manager = ' ME '
    let excelTemplateBytes: Uint8Array;
    excelTemplate.subscribe(value => {
        excelTemplateBytes = value;
    });

    let excelContent;
    pdfContent.subscribe(value => {
        excelContent = value && {
            summary: createSummary(value),
        }
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

    function updateWorkbook(workbook, data) {
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

        worksheet.getCell("B22").value = manager;
        worksheet.getCell("B23").value = format(new Date(), "yyyy-MM-dd");
    }

    function downloadExcel() {
        if (excelContent && excelContent) {
            const data = excelContent;
            return pipe(
                readExcelFile(excelTemplateBytes),
                TE.fold(handleError, (workbook) => {
                    updateWorkbook(workbook, data);

                    workbook.xlsx.writeBuffer().then((buffer) => {
                        const blob = new Blob([buffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = "fName.xlsx";
                        link.click();
                        URL.revokeObjectURL(link.href);
                    });
                    return TE.of("Hooray");
                })
            )()
        }
    }
</script>
<button on:click={downloadExcel}>Download excel</button>