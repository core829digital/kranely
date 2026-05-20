// src/utils/imageConverter.js

/**
 * Trascodifica universalmente un'immagine (JPG, PNG, etc) in formato WEBP.
 * @param {File} file Il file immagine originale.
 * @param {number} quality La qualità della compressione (0-1), default 0.85
 * @returns {Promise<File>} Promise che risolve col nuovo file WEBP (o col file originale se non convertibile).
 */
export const convertToWebP = (file, quality = 0.85) => {
    return new Promise((resolve) => {
        // Controlla se è un'immagine JPEG o PNG. Se è già WebP, SVG, o generico, skippa.
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
            return resolve(file); // Ritorna l'originale
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                console.warn("FileReader result is not a string, skipping conversion.");
                return resolve(file);
            }
            const img = new Image();
            img.src = result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            console.warn("Canvas toBlob failed, returning original file.");
                            return resolve(file);
                        }

                        // Sostituisci l'estensione nel nome originale con .webp
                        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";

                        const webpFile = new File([blob], newName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });

                        resolve(webpFile);
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = () => {
                console.warn("Image load error during WebP conversion, returning original file.");
                resolve(file);
            };
        };

        reader.onerror = () => {
            console.warn("FileReader error during WebP conversion, returning original file.");
            resolve(file);
        };
    });
};
