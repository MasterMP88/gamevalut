/** Browser-only JPEG thumbnail. Canvas removes metadata; no original upload or public URL. */
export async function photoThumbnail(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 16 * 1024 * 1024)
    throw new Error("Bitte ein Bild unter 16 MB auswählen.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(
          new Error(
            "Dieses Bild kann dein Browser nicht öffnen. Ein JPEG oder PNG funktioniert meist.",
          ),
        );
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      800 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error(
        "Die Bildverarbeitung ist hier nicht verfügbar. Beschreibe stattdessen dein Motiv.",
      );
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.65, 0.5, 0.35, 0.2]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= 250000) return data;
    }
    throw new Error(
      "Das Bild ist zu detailreich. Versuche einen kleineren Ausschnitt oder beschreibe dein Motiv.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
