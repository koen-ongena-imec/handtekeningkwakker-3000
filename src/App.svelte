<script lang="ts">
    import stampLogo from './assets/logo.png'
    import PdfFileUploader from "./lib/PdfFileUploader.svelte";
    import PdfData from "./lib/PdfData.svelte";
    import PdfViewer from "./lib/PdfViewer.svelte";
    import SignatureUploader from "./lib/SignatureUploader.svelte";
    import ExcelTemplateUploader from "./lib/ExcelTemplateUploader.svelte";
    import DownloadExcel from "./lib/DownloadExcel.svelte";
    import DownloadSignedPdf from "./lib/DownloadSignedPdf.svelte";
    import Stepper from "./lib/Stepper.svelte";
</script>

<main>
    <h1>Handtekeningkwakker 3000</h1>
    <!--    <div>-->
    <!--        <a href="https://svelte.dev" target="_blank" rel="noreferrer">-->
    <!--            <img src={stampLogo} class="logo svelte" alt="Svelte Logo"/>-->
    <!--        </a>-->
    <!--    </div>-->

    <!--    <Stepper />-->

    <div class="flex flex-col gap-5 mb-4 mt-4">
        <h2 class="text-4xl font-extrabold dark:text-white">Files</h2>
        <SignatureUploader/>
        <ExcelTemplateUploader/>
        <PdfFileUploader/>
        <!--        <PdfViewer/>-->
    </div>

    <h2 class="text-4xl font-extrabold dark:text-white">Extracted data</h2>
    <PdfData/>

    <div class="flex mt-4 gap-4">
        <DownloadExcel/>
        <DownloadSignedPdf/>
    </div>
</main>

<style>
    .logo {
        height: 6em;
        padding: 1.5em;
        will-change: filter;
        transition: filter 300ms;
    }

    .logo:hover {
        filter: drop-shadow(0 0 2em #646cffaa);
    }

    .logo.svelte:hover {
        filter: drop-shadow(0 0 2em #ff3e00aa);
    }

    .read-the-docs {
        color: #888;
    }
</style>