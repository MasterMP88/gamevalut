export function TitleGallery({
  items,
}: {
  items: Array<{ label: string; value: string; playerId?: string }>;
}) {
  if (!items.length) return null;
  return (
    <section className="my-6" aria-label="Eure Titelgalerie">
      <h3 className="font-display text-3xl">Eure Titel der Nacht</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Momentaufnahmen aus dieser Runde. Ihr entscheidet, welche ihr behaltet.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((r, i) => (
          <li
            key={`${r.playerId}-${i}`}
            className="border-l-2 border-[var(--g)] bg-foreground/5 p-4"
          >
            <span className="font-mono text-xs text-[var(--g)]">{r.label}</span>
            <p className="mt-2 font-display text-2xl">{r.value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
