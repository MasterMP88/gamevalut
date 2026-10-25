/* Real QR code (ISO 18004 via `qrcode`), drawn as SVG with theme tokens. Encodes only the given URL. */
import { useMemo } from "react";
import QRCode from "qrcode";

export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const d = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    let path = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) path += `M${x + 2} ${y + 2}h1v1h-1z`;
    return { path, size: n + 4 };
  }, [value]);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${d.size} ${d.size}`} shapeRendering="crispEdges" className={className} data-qr={value}>
      <rect width={d.size} height={d.size} className="fill-foreground" />
      <path d={d.path} className="fill-background" />
    </svg>
  );
}
