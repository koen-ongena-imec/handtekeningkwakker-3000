<script lang="ts">
    import type {PdfContent} from "./parsers";
    import {extractDataFromUint8Array} from "./parsers";
    import {pdfContent} from "./stores";
    import {pdf} from "./stores";
    import * as Either from "fp-ts/Either";
    import Dropzone from "./Dropzone.svelte";

    const readBytes = (e) => {
        // const file = e.detail;
        const file = e.target.files[0];;
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            pdf.set({bytes, name: file.name});
            extractDataFromUint8Array(bytes)().then(value => {
                Either.fold<Error, PdfContent>(e1 => {
                    console.log(e1);
                }, e2 => {
                    pdfContent.set(e2);
                    console.log(e2);
                })(value);
            });


        };
        reader.readAsArrayBuffer(file);
    };
</script>

<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Timesheet</label>
<input on:change={readBytes} class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file">
<!--<Dropzone on:drop={readBytes} />-->