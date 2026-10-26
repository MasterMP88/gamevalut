import { useEffect, useState } from "react";
import type { RoomClient } from "@/lib/gang/room-client";
import type { PublicCard } from "@/lib/gang/online";

export function useRoomPhotos(
  client: RoomClient,
  token: string,
  cards: PublicCard[],
) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const ids = cards
    .flatMap((c) => (c.photoId ? [c.photoId] : []))
    .sort()
    .join(",");
  useEffect(() => {
    setPhotos({});
    if (!ids) return;
    let off = false;
    let retry: ReturnType<typeof setTimeout>;
    const fetch = () =>
      void client
        .getPhotos(token, ids.split(","))
        .then((rows) => {
          if (!off)
            setPhotos(Object.fromEntries(rows.map((r) => [r.photoId, r.url])));
        })
        .catch(() => {
          if (!off) retry = setTimeout(fetch, 2000);
        });
    fetch();
    return () => {
      off = true;
      clearTimeout(retry);
    };
  }, [client, token, ids]);
  return photos;
}

export function PhotoGallery({
  cards,
  photos,
}: {
  cards: PublicCard[];
  photos: Record<string, string>;
}) {
  if (!cards.some((c) => c.photoId)) return null;
  return (
    <div
      className="my-6 grid gap-4 sm:grid-cols-2"
      aria-label="Fotogalerie der Runde"
    >
      {cards
        .filter((c) => c.photoId)
        .map((c) => (
          <figure key={c.key} className="border border-line p-3">
            {photos[c.photoId!] ? (
              <img
                src={photos[c.photoId!]}
                alt={c.label || "Fotomotiv der Runde"}
                className="max-h-80 w-full object-contain"
              />
            ) : (
              <p
                role="status"
                className="py-10 text-center text-muted-foreground"
              >
                Foto wird geladen …
              </p>
            )}
            <figcaption className="mt-3 font-display text-xl">
              {c.label}
            </figcaption>
          </figure>
        ))}
    </div>
  );
}
