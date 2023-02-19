<script lang="ts">
    import {excelTemplate} from "./stores";

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            excelTemplate.set(bytes);
        };
        reader.readAsArrayBuffer(file);
    };
</script>

<label>Excel template: <input type="file" on:change={readBytes} ></label>