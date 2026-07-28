/**
 * Utility: merge class names, filtering out falsy values.
 * A lightweight alternative to clsx + tailwind-merge for this project.
 */
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}
