<script lang="ts">
    import {extractDataFromUint8Array} from "./parsers";

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            const dataP = extractDataFromUint8Array(bytes);
            dataP().then((data) => console.log(data));
        };
        reader.readAsArrayBuffer(file);
    };
</script>

<input type="file" on:change={readBytes}>