/* The content slot. Deliberately empty — the shell exists so the layout is settled
   before there is anything to put in it, and a placeholder that pretends otherwise
   would be the first thing to throw away. */
export default function AppPage() {
  return (
    <section className="min-h-[40vh] max-w-[52ch]">
      <h1 className="text-22 font-medium text-ink">Nothing is open yet.</h1>
      <p className="text-16 text-ink-secondary mt-3">
        The workspace fills in from slice 1, starting with organisations and users. Until then this
        is the shell only.
      </p>
    </section>
  );
}
