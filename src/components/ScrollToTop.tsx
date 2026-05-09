import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;

    if (hash) {
      const id = hash.replace('#', '');
      if (!id) return;

      // Wait for the next paint so the target element exists.
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: 'start' });
        }
      });

      return;
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [location.hash, location.pathname, location.search]);

  return null;
}
