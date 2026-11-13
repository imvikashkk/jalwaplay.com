'use client';

import { useEffect } from 'react';

// Only the first mount per document should react to how the document was loaded.
let initialLoadChecked = false;

export default function BackForwardReload() {
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    // Document came from history (Back/Forward) and `pageshow` already fired
    // before hydration — reload so the server-side guard runs again.
    if (!initialLoadChecked) {
      initialLoadChecked = true;
      if (nav?.type === 'back_forward') {
        window.location.reload();
        return;
      }
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      // Restored from the back/forward cache
      if (event.persisted) window.location.reload();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return null;
}
