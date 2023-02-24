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


<div class="flex gap-4 flex-col flex">
    <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
        <p>{data.nameOfTheConsultant}</p>
    </div>
    <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Company name</label>
        <p>{data.companyName}</p>
    </div>
    <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Period</label>
        <p>{data.period}</p>
    </div>

    <div class="relative overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Project name
                </th>
                <th scope="col" class="px-6 py-3">
                    Code
                </th>
                <th scope="col" class="px-6 py-3">
                    Hours spent
                </th>
                <th scope="col" class="px-6 py-3">
                    Days spent
                </th>
            </tr>
            </thead>
            <tbody>
            {#each entries as row}
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4">{row.name}</td>
                    <td class="px-6 py-4">{row.code}</td>
                    <td class="px-6 py-4">{row.hours}</td>
                    <td class="px-6 py-4">toDays({row.hours})</td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</div>


