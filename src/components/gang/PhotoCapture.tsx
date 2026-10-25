import { useId, useState } from "react";
import { photoThumbnail } from "@/lib/photo";
export function PhotoCapture({
  value,
  onChange,
  disabled = false,
}: {
  value?: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-4">
      {value && (
        <img
          src={value}
          alt="Dein Motiv für diese Runde"
          className="max-h-52 w-full rounded-md object-contain"
        />
      )}
      <label
        htmlFor={id}
        className="tap mt-2 flex min-h-12 cursor-pointer items-center justify-center rounded-md border border-line px-4 text-sm"
      >
        {busy
          ? "Foto wird vorbereitet …"
          : disabled
            ? "Fotozeit ist vorbei"
            : value
              ? "Anderes Foto aufnehmen"
              : "Optional: Foto aufnehmen"}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled || busy}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await photoThumbnail(file));
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Foto konnte nicht geöffnet werden.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Nur eine verkleinerte Kopie ohne Bildmetadaten. Wird in eurem Raum
        gezeigt. Ohne Foto geht es auch.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  );
}
