/**
 * Join conditional class names. Deliberately dependency-free — the design
 * system never puts two conflicting utilities on the same element, so a
 * conflict-resolving merge is not needed.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
