import { useEffect } from 'react';

// Hash routes don't load a new page, so each page does what a page load
// would: it names the tab, and after moving from another page it starts at
// the top with focus on its heading, where a screen reader picks up. The
// first page of a visit keeps the browser's own focus and scroll.
let shownTitle: string | null = null;

export function usePage(title: string): void {
  useEffect(() => {
    document.title = title;
    if (shownTitle === title) return;
    const first = shownTitle === null;
    shownTitle = title;
    if (first) return;
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [title]);
}
