// Small line icons for buttons and links. Decorative: the text beside each
// one, or the link's aria-label, names the action.

function Icon({ d, className = 'size-5' }: { d: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export const ChevronLeft = () => <Icon d="M15 5l-7 7 7 7" className="size-6" />;
export const ChevronRight = () => <Icon d="M9 5l7 7-7 7" className="size-6" />;
export const GridIcon = () => <Icon d="M5 4h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10 0h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM5 14h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm10 0h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />;
export const UndoIcon = () => <Icon d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />;
export const ClearIcon = () => <Icon d="M6 6l12 12M18 6L6 18" />;
export const CheckIcon = () => <Icon d="M5 12.5l4.5 4.5L19 7.5" />;
export const RetryIcon = () => <Icon d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />;
export const SoundOnIcon = () => <Icon d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9a4.2 4.2 0 0 1 0 6M18.8 6.3a8 8 0 0 1 0 11.4" className="size-6" />;
export const SoundOffIcon = () => <Icon d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5" className="size-6" />;
export const LockIcon = ({ className = 'size-5' }: { className?: string }) => (
  <Icon d="M8 11V8a4 4 0 0 1 8 0v3M7 11h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" className={className} />
);
