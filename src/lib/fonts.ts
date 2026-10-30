import { useEffect, useState } from 'react';

// Khmer must never render in a system fallback font. Wait for this before
// showing a Khmer letter or drawing one onto a canvas.

export const KHMER_FONT_FAMILY = '"Kantumruy Pro"';

export async function loadKhmerFont(sample = 'ក'): Promise<boolean> {
  try {
    const faces = await document.fonts.load(`64px ${KHMER_FONT_FAMILY}`, sample);
    return faces.length > 0;
  } catch {
    return false;
  }
}

export function useKhmerFontReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void loadKhmerFont().then((loaded) => {
      if (live) setReady(loaded);
    });
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
