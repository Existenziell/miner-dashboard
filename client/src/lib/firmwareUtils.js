export function formatPublished(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function pickFirmwareAsset(assets) {
  if (!assets?.length) return null;
  const bin = assets.find((a) => a.name && a.name.toLowerCase().endsWith('.bin'));
  return bin || assets[0];
}
