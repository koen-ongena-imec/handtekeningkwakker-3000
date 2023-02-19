<script lang="ts">
    import {pipe} from "fp-ts/function";
    import * as TE from "fp-ts/TaskEither";
    import * as E from "fp-ts/Either";
    import * as A from "fp-ts/Array";
    import type {Option} from "fp-ts/Option";
    import * as O from "fp-ts/Option";
    import type {TextItem} from "pdfjs-dist/types/src/display/api";
    import type {PDFDocumentProxy, PDFPageProxy} from "pdfjs-dist";
    import {pdf as pdfStore, signature as signatureStore} from "./stores";
    import {format} from "date-fns";
    import {PDFDocument, PDFImage} from "pdf-lib";
    import type {Either} from "fp-ts/Either";

    let pdf;
    pdfStore.subscribe(value => {
        pdf = value;
    });
    let signature;
    signatureStore.subscribe(value => {
        signature = value;
    });
    type PdfSrc = Uint8Array;

    type SignedPdfOptions = {
        signature: Uint8Array;
        manager: string;
    };

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
        pdfSrc: Uint8Array
    ): TE.TaskEither<Error, TextItem[]> {
        return pipe(
            getDocument(pdfSrc),
            TE.chain((doc) => getPage(1)(doc)),
            TE.chain((page: PDFPageProxy) => getTextContent(page)),
            TE.map((textContent) => textContent.items as TextItem[])
        );
    }


    export function findCustomerSignatureLabelPosition(
        pdfSrc: Uint8Array
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


    const addSignatureOnXY: (pdfBytes: Uint8Array, signature: Uint8Array, options: SignedPdfOptions) => (xy: XY) => TE.TaskEither<Error, Uint8Array> = (
        pdfBytes: Uint8Array,
        signature: Uint8Array,
        options: SignedPdfOptions
    ) => {
        const {manager} = options;
        // const outputPdfFilePath = buildSignedPdfOutputPath(pdfFilePath, options);

        // TODO this needs cleaning up :/
        return (xy: XY) =>
            TE.tryCatch(
                () => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            const pdfDoc = await PDFDocument.load(pdfBytes);
                            const firstPage = pdfDoc.getPage(0);

                            const image = await pdfDoc.embedPng(signature);
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
                                format(new Date(), "yyyy-MM-dd") + " " + manager,
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
            manager: "John Doe",
        });

        if (E.isRight(signedPdf)) {
            const blob = new Blob([signedPdf.right], {type: "application/pdf"});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "fName.pdf";
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            console.log('Error: ', signedPdf.left);
        }
    }

</script>

<button on:click={signPdf}>Download signed PDF</button>