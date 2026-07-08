/** Extract PDF page visuals for animated game scenes */
window.LoreboundPdfMedia = {
    async extractFromFile(file) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
        const totalPages = pdf.numPages;
        const textPageLimit = Math.min(totalPages, LoreboundLimits.PDF_MAX_PAGES);
        const visualLimit = Math.min(totalPages, LoreboundLimits.PDF_VISUAL_PAGES);

        const textPromises = [];
        for (let i = 1; i <= textPageLimit; i++) {
            textPromises.push(
                pdf.getPage(i).then(page =>
                    page.getTextContent().then(tc => tc.items.map(it => it.str).join(' '))
                )
            );
        }

        const imagePromises = [];
        for (let i = 1; i <= visualLimit; i++) {
            imagePromises.push(this._renderPageThumb(pdf, i));
        }

        const [pagesText, pageImages] = await Promise.all([
            Promise.all(textPromises),
            Promise.all(imagePromises),
        ]);

        const truncated = LoreboundLimits.truncate(pagesText.join('\n\n'));

        return {
            text: truncated.text,
            textTruncated: truncated.truncated,
            words: truncated.words,
            chars: truncated.chars,
            totalPages,
            pagesRead: textPageLimit,
            pageImages: pageImages.filter(Boolean),
            filename: file.name,
        };
    },

    async _renderPageThumb(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1, 420 / viewport.width);
        const scaled = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
        return {
            page: pageNum,
            dataUrl: canvas.toDataURL('image/jpeg', 0.72),
            width: scaled.width,
            height: scaled.height,
        };
    },

    imageForIndex(images, index) {
        if (!images?.length) return null;
        return images[index % images.length].dataUrl;
    },
};
