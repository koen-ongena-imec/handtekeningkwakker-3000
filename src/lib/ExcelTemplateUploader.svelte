<script lang="ts">
    import {excelTemplate} from "./stores";

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            excelTemplate.set({bytes, name: file.name});
        };
        reader.readAsArrayBuffer(file);
    };
</script>


<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white" for="file_input">Excel template</label>
<input on:change={readBytes} class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file">
