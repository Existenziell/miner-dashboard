export const SHOW_BLOCK_FOUND_PREVIEW_EVENT = 'showBlockFoundPreview';

/** Call from Settings > Appearance to preview the block-found overlay. */
export function requestBlockFoundPreview() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SHOW_BLOCK_FOUND_PREVIEW_EVENT));
}
