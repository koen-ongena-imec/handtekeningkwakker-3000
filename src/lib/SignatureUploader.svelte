<script lang="ts">
    import {signature} from "./stores";

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            signature.set(bytes);
        };
        reader.readAsArrayBuffer(file);
    };
</script>

<label>Signature: <input type="file" on:change={readBytes} accept="image/jpeg"></label>