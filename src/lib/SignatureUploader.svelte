<script lang="ts">
    import {signature} from "./stores";

    let imgRef;
    function displaySignature(bytes: any) {
        // const canvas = document.getElementById('signature') as HTMLCanvasElement;
        // const ctx = canvas.getContext('2d');
        // const img = new Image();
        // img.onload = () => {
        //     ctx.drawImage(img, 0, 0);
        // };
        imgRef.src = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    }

    const readBytes = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);
            signature.set({ bytes, name: file.name });

            // displaySignature(bytes);
        };
        reader.readAsArrayBuffer(file);
    };


</script>

<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white" for="file_input">Signature</label>
<input on:change={readBytes} class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="file_input" type="file">

<img bind:this={imgRef} style="max-width: 15rem">