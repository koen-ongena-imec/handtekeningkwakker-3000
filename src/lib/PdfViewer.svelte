<script>
    import {onMount} from "svelte";
    import {pdf} from "./stores";

    let canvas;

    pdf.subscribe(async value => {
        if (value) {
            const pdfJs = await import('pdfjs-dist/build/pdf');
            const pdfJsWorker = await import('pdfjs-dist/build/pdf.worker.entry');

            pdfJs.GlobalWorkerOptions.workerSrc = pdfJsWorker;
            const loadingTask = pdfJs.getDocument(value);
            loadingTask.promise.then(function (pdf) {
                pdf.getPage(0).then(function (page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({scale: scale,});
                    // Support HiDPI-screens.
                    const outputScale = window.devicePixelRatio || 1;

                    const context = canvas.getContext('2d');

                    canvas.width = Math.floor(viewport.width * outputScale);
                    canvas.height = Math.floor(viewport.height * outputScale);
                    canvas.style.width = Math.floor(viewport.width) + "px";
                    canvas.style.height = Math.floor(viewport.height) + "px";

                    const transform = outputScale !== 1
                        ? [outputScale, 0, 0, outputScale, 0, 0]
                        : null;

                    const renderContext = {
                        canvasContext: context,
                        transform: transform,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            });



        }
    })

    onMount(async () => {

    });
</script>

<canvas id="the-canvas" bind:this={canvas}></canvas>