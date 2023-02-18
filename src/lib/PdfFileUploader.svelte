<script lang="ts">
    import type {PdfContent} from "./parsers";
    import {extractDataFromUint8Array} from "./parsers";
    import {pdfContent} from "./stores";
    import {pdf} from "./stores";
    import * as Either from "fp-ts/Either";

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            pdf.set(bytes);
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

<input type="file" on:change={readBytes}>