<script lang="ts">
    import {pdfContent} from "./stores.js";
    import type {PdfContent} from "./parsers";
    import type {SummaryEntry} from "./Timesheet";
    import {createSummary} from "./Timesheet";

    let data: Partial<PdfContent> = {
        nameOfTheConsultant: "",
        companyName: "",
        period: "",
    };
    let entries: SummaryEntry[];

    pdfContent.subscribe(value => {
        data = value;
        entries = createSummary(value);
    });
</script>

<div>
    <label>Name: {data.nameOfTheConsultant}</label><br>
    <label>Company: {data.companyName}</label><br>
    <label>Period: {data.period}</label><br>
    <table>
        <tr>
            <th>Project name</th>
            <th>Code</th>
            <th>Hours spent</th>
        </tr>
        {#each entries as row}
            <tr>
                <td>{row.name}</td>
                <td>{row.code}</td>
                <td>{row.hours}</td>
            </tr>
        {/each}
    </table>
</div>