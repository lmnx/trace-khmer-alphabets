// Khmer text, hidden until Kantumruy Pro loads, so Khmer never shows in a
// system font.
export function KhmerText({ text, fontReady, className = '' }: { text: string; fontReady: boolean; className?: string }) {
  return (
    <span lang="km" className={`${className} ${fontReady ? '' : 'invisible'}`}>
      {text}
    </span>
  );
}
