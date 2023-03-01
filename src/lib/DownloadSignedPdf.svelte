<script lang="ts">
    import {pipe} from "fp-ts/function";
    import * as TE from "fp-ts/TaskEither";
    import type {Either} from "fp-ts/Either";
    import * as E from "fp-ts/Either";
    import * as A from "fp-ts/Array";
    import type {Option} from "fp-ts/Option";
    import * as O from "fp-ts/Option";
    import type {TextItem} from "pdfjs-dist/types/src/display/api";
    import type {PDFDocumentProxy, PDFPageProxy} from "pdfjs-dist";
    import type {UploadedFile} from "./stores";
    import {
        pdf as pdfStore,
        pdfContentStore,
        signature as signatureStore,
        signingData as signingDataStore
    } from "./stores";
    import {PDFDocument, PDFImage} from "pdf-lib";
    import type {PdfContent} from "./parsers";
    import {buildSignedPdfFileName} from "./files";

    let pdf: UploadedFile;
    pdfStore.subscribe(value => {
        pdf = value;
    });
    let pdfContent: PdfContent;
    pdfContentStore.subscribe((value: PdfContent) => {
        pdfContent = value;
    });
    type Signature = { bytes: Uint8Array, name: string };
    let signature: Signature;
    signatureStore.subscribe(value => {
        signature = value;
    });
    type PdfSrc = Uint8Array;

    type SignedPdfOptions = {
        signature: Signature;
        manager: string;
        signingDate: string;
    };

    let signingData;
    signingDataStore.subscribe(value => {
        signingData = value;
    });

    type XY = { x: number; y: number };

    const getDocument = (src: PdfSrc) =>
        TE.tryCatch<Error, PDFDocumentProxy>(
            async () => {
                const pdfJs = await import("pdfjs-dist/legacy/build/pdf.js");
                return pdfJs.getDocument(src).promise;
            },
            (error) => new Error(String(error))
        );

    const getPage = (page: number) => (doc: PDFDocumentProxy) =>
        TE.tryCatch(
            () => doc.getPage(page),
            (reason) => new Error(String(reason))
        );

    const getTextContent = (page: PDFPageProxy) =>
        TE.tryCatch(
            () => {
                return page.getTextContent({
                    disableCombineTextItems: false,
                    includeMarkedContent: false,
                });
            },
            (reason) => new Error(String(reason))
        );

    function extractFirstPageTextItems(
        pdfSrc: UploadedFile
    ): TE.TaskEither<Error, TextItem[]> {
        return pipe(
            getDocument(pdfSrc.bytes),
            TE.chain((doc) => getPage(1)(doc)),
            TE.chain((page: PDFPageProxy) => getTextContent(page)),
            TE.map((textContent) => textContent.items as TextItem[])
        );
    }


    export function findCustomerSignatureLabelPosition(
        pdfSrc: UploadedFile
    ): TE.TaskEither<Error, Option<XY>> {
        return pipe(
            pdfSrc,
            extractFirstPageTextItems,
            TE.map(A.findFirst((a: TextItem) => a.str === "Signature customer")),
            TE.map(
                O.map((te: TextItem) => {
                    const [_0, _1, _2, _3, x, y] = te.transform;
                    return {x, y};
                })
            )
        );
    }

    function defaultToIfMissing<A>(o: A) {
        return O.getOrElse(() => o);
    }

    function resizeImage(image: PDFImage, targetHeight: number) {
        const aspectRatio = targetHeight / image.height;
        const targetWidth = image.width * aspectRatio;

        return {width: targetWidth, height: targetHeight};
    }


    function embedImage(pdfDoc: PDFDocument, signature: Signature) {
        if (signature.name.toLowerCase().endsWith(".png")) {
            return pdfDoc.embedPng(signature.bytes);
        } else if (signature.name.toLowerCase().endsWith(".jpg")) {
            return pdfDoc.embedJpg(signature.bytes);
        }
    }

    const addSignatureOnXY: (pdf: UploadedFile, signature: Signature, options: SignedPdfOptions) => (xy: XY) => TE.TaskEither<Error, Uint8Array> = (
        pdf: UploadedFile,
        signature: Signature,
        options: SignedPdfOptions
    ) => {
        // const outputPdfFilePath = buildSignedPdfOutputPath(pdfFilePath, options);

        // TODO this needs cleaning up :/
        return (xy: XY) =>
            TE.tryCatch(
                () => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            const pdfDoc = await PDFDocument.load(pdf.bytes);
                            const firstPage = pdfDoc.getPage(0);

                            const image = await embedImage(pdfDoc, signature);
                            const imageTargetHeight = 50;
                            const {height, width} = resizeImage(image, imageTargetHeight);

                            // Draw the image on the page
                            firstPage.drawImage(image, {
                                x: xy.x,
                                y: xy.y + imageTargetHeight - 20,
                                width,
                                height,
                            });

                            firstPage.drawText(
                                options.signingDate + " " + options.manager,
                                {
                                    x: xy.x,
                                    y: xy.y + 19,
                                    size: 8,
                                }
                            );

                            const newFileBytes = await pdfDoc.save();

                            resolve(newFileBytes);
                        } catch (e) {
                            reject(e);
                        }
                    });
                },
                (reason) => {
                    return new Error(String(reason));
                }
            );
    };


    function createSignedPdf(options: SignedPdfOptions) {
        const {signature, manager} = options;
        return pipe(
            pdf,
            findCustomerSignatureLabelPosition,
            TE.map(defaultToIfMissing({x: 335, y: 40})),
            TE.chain(addSignatureOnXY(pdf, signature, options))
        )();
    }


    let signPdf = async () => {
        const signedPdf: Either<Error, Uint8Array> = await createSignedPdf({
            signature: signature,
            manager: signingData.manager,
            signingDate: signingData.signingDate
        });

        if (E.isRight(signedPdf)) {
            const blob = new Blob([signedPdf.right], {type: "application/pdf"});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = signedPdfName;
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            console.log('Error: ', signedPdf.left);
        }
    }

    $: disabled = ((signedPdfName || '') === '') || !signature.name;

    $: signedPdfName = buildSignedPdfFileName(pdfContent);

</script>


<button disabled={disabled} on:click={signPdf} type="button"
        title="Download {signedPdfName}"
        class={ disabled ? "inline-flex text-white bg-blue-400 dark:bg-blue-500 cursor-not-allowed font-medium rounded-lg text-sm px-5 py-2.5 text-center" : "text-white bg-[#2557D6] hover:bg-[#2557D6]/90 focus:ring-4 focus:ring-[#2557D6]/50 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#2557D6]/50 mr-2 mb-2"}>
    <svg class="w-6 h-6 mr-2 -ml-1" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
         viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
    Download PDF
</button>