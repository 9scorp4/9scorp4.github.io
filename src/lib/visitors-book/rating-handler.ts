/**
 * Poem rating handler for VisitorsBook.
 * Uses delegated event handling for dynamic rating buttons.
 */

/** Bind rating button click handler with event delegation */
export function bindRatingHandler(output: HTMLDivElement): () => void {
  const handleClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('rating-btn')) return;

    const ratingRow = target.closest('.rating-row') as HTMLElement | null;
    if (!ratingRow) return;

    const poemId = ratingRow.dataset.poemId;
    const workerUrl = ratingRow.dataset.workerUrl;
    const rating = target.dataset.rating;

    if (!poemId || !workerUrl || !rating) return;

    try {
      const resp = await fetch(`${workerUrl}/bonjour/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poemHash: poemId, rating }),
      });
      const data = await resp.json() as { ok?: boolean; error?: string };
      ratingRow.innerHTML = `<span class="rating-confirmed">${data.ok ? 'noté.' : data.error}</span>`;
    } catch {
      ratingRow.innerHTML = '<span class="rating-confirmed">erreur.</span>';
    }
  };

  output?.addEventListener('click', handleClick);

  return () => {
    output?.removeEventListener('click', handleClick);
  };
}
