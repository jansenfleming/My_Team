// Global Konami-code listener + confirmation banner, egg 3 (docs/design/easter-eggs.md
// §3, board task E6). Mounted once inside Layout (src/layout/Layout.tsx) so it's alive
// for every route without remounting on navigation — Layout itself doesn't remount when
// the route changes in the current shell, only Pages does (see App.tsx). Not restricted
// to any one page: a visitor might land first on /about or /lookbook, not the catalog.
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "../router/Router";
import {
  KONAMI_SEQUENCE,
  isEditableTarget,
  nextKonamiProgress,
  setKonamiUnlocked,
} from "./konami";

export function KonamiEasterEgg() {
  const progressRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const { pathname } = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Never intercept a keystroke while focus is in an editable element — see
      // isEditableTarget's comment. Don't advance or reset progress on that keystroke.
      if (isEditableTarget(document.activeElement)) {
        return;
      }

      // Never call preventDefault() on any of these keys, matched or not — arrow-key
      // page scroll and normal typing must behave identically whether or not a sequence
      // is in progress (docs/design/easter-eggs.md §3).
      const next = nextKonamiProgress(progressRef.current, event.key);
      if (next === KONAMI_SEQUENCE.length) {
        progressRef.current = 0;
        setKonamiUnlocked();
        // Re-entering the full sequence after it's already unlocked is harmless and
        // simply re-shows the banner — no special-casing needed.
        setVisible(true);
      } else {
        progressRef.current = next;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dismissed by: the × button (below), clicking the link (which navigates away and so
  // changes `pathname`), or any other route change. No fixed timer — a visitor using a
  // screen reader or navigating slowly can't have it vanish before they act on it.
  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  return (
    <div className="konami-banner-region" aria-live="polite">
      {visible && (
        <div className="konami-banner">
          <p className="konami-banner__text">Item unlocked.</p>
          <Link to="/product/200-ok" className="konami-banner__link">
            View 200 OK Tee
          </Link>
          <button
            type="button"
            className="konami-banner__dismiss"
            aria-label="Dismiss"
            onClick={() => setVisible(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
