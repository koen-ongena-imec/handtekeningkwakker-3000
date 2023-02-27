<script lang="ts">
    import {excelTemplate} from "./stores";
    import template from '../../public/template.xlsx'

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


<div class="flex p-4 mt-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
    <svg aria-hidden="true" class="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
    <span class="sr-only">Huh?</span>
    <div>
        <p class="text-gray-500 dark:text-gray-400">No idea what the excel template should look like? Then download <a href="/template.xlsx" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">this template</a>, change you name and signature, save and re-upload.</p>

    </div>
</div>