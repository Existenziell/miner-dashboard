import { useCallback, useEffect, useState } from 'react';
import { useMiner } from '@/context/MinerContext';
import {
  fetchFirmwareReleases,
  fetchFirmwareChecksum,
  downloadFirmwareFromUrl,
  flashFirmwareFile,
} from '@/lib/api';
import { formatPublished, pickFirmwareAsset } from '@/lib/firmwareUtils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { IconDownload } from '@/components/Icons';
import { Field } from '@/components/settings/Field';

export function TabFirmware() {
  const { data: miner, error: minerError } = useMiner();
  const [releases, setReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [showPrereleases, setShowPrereleases] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [expectedSha256, setExpectedSha256] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState(null);
  const [downloadedGitHubFirmware, setDownloadedGitHubFirmware] = useState(null);
  const [firmwareFile, setFirmwareFile] = useState(null);
  const [wwwFile, setWwwFile] = useState(null);
  const [flashingFirmware, setFlashingFirmware] = useState(false);
  const [flashingWww, setFlashingWww] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashedVersionPending, setFlashedVersionPending] = useState(null);
  const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false);
  const [lastChecksumResult, setLastChecksumResult] = useState(null);

  const currentVersion = miner?.version ? (miner.version.startsWith('v') ? miner.version : `v${miner.version}`) : '—';

  const normalizedCurrentVersion = currentVersion !== '—' ? currentVersion.toLowerCase() : null;

  const isSameVersionAsInstalled =
    currentVersion !== '—' &&
    selectedRelease?.tag_name != null &&
    currentVersion.toLowerCase() === selectedRelease.tag_name.toLowerCase();

  const loadReleases = useCallback(async () => {
    setLoadingReleases(true);
    try {
      const list = await fetchFirmwareReleases({ includePrereleases: showPrereleases });
      setReleases(list);
      setSelectedRelease((prev) => {
        if (!list.length) return null;
        if (prev && list.some((r) => r.tag_name === prev.tag_name)) return prev;
        return list[0];
      });
    } catch (err) {
      setDownloadMessage({ type: 'error', text: err.message });
    } finally {
      setLoadingReleases(false);
    }
  }, [showPrereleases]);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  useEffect(() => {
    if (!selectedRelease) {
      setExpectedSha256(null);
      return;
    }
    const asset = pickFirmwareAsset(selectedRelease.assets);
    if (!asset?.checksumUrl) {
      setExpectedSha256(null);
      return;
    }
    let cancelled = false;
    fetchFirmwareChecksum(asset.checksumUrl).then((hash) => {
      if (!cancelled) setExpectedSha256(hash);
    });
    return () => { cancelled = true; };
  }, [selectedRelease]);

  useEffect(() => {
    setDownloadedGitHubFirmware(null);
    setLastChecksumResult(null);
  }, [selectedRelease?.tag_name]);

  useEffect(() => {
    if (!flashedVersionPending || !normalizedCurrentVersion) return;
    const expected = flashedVersionPending.toLowerCase();
    if (normalizedCurrentVersion === expected) {
      setFlashMessage({ type: 'success', text: `Flash successful. Device is now on ${currentVersion}.` });
      setFlashedVersionPending(null);
    }
  }, [flashedVersionPending, normalizedCurrentVersion, currentVersion]);

  const selectedAsset = selectedRelease ? pickFirmwareAsset(selectedRelease.assets) : null;
  const downloadUrl = selectedAsset?.browser_download_url || null;
  const filename = selectedAsset?.name || '—';
  const published = selectedRelease ? formatPublished(selectedRelease.published_at) : '—';

  const handleDownloadFromGitHub = async () => {
    if (!downloadUrl) {
      setDownloadMessage({ type: 'error', text: 'No firmware file in this release.' });
      return;
    }
    setShowDownloadConfirmModal(false);
    setDownloading(true);
    setDownloadMessage(null);
    setLastChecksumResult(null);
    setDownloadedGitHubFirmware(null);
    try {
      const data = await downloadFirmwareFromUrl({
        url: downloadUrl,
        expectedSha256: expectedSha256 || undefined,
      });
      setLastChecksumResult({
        checksumVerified: data.checksumVerified,
        computedSha256: data.computedSha256 ?? null,
        expectedSha256: data.expectedSha256 ?? null,
      });
      setDownloadedGitHubFirmware({
        blob: data.blob,
        computedSha256: data.computedSha256,
        expectedSha256: data.expectedSha256,
        checksumVerified: data.checksumVerified,
      });
      setDownloadMessage({ type: 'success', text: 'Download complete. Verify checksum above, then click Flash.' });
    } catch (err) {
      const body = err.installErrorBody;
      if (body) {
        setLastChecksumResult({
          checksumVerified: body.checksumVerified,
          computedSha256: body.computedSha256 ?? null,
          expectedSha256: body.expectedSha256 ?? null,
          mismatch: true,
        });
      }
      setDownloadMessage({ type: 'error', text: err.message });
    } finally {
      setDownloading(false);
    }
  };

  const handleFlashDownloadedFirmware = async () => {
    if (!downloadedGitHubFirmware?.blob) return;
    setFlashingFirmware(true);
    setFlashMessage(null);
    try {
      await flashFirmwareFile(downloadedGitHubFirmware.blob, 'firmware');
      const versionTag = selectedRelease?.tag_name ?? null;
      setFlashedVersionPending(versionTag);
      setFlashMessage({
        type: 'success',
        text: versionTag
          ? `Flash started. Device may reboot. Success will be confirmed when it comes back online with ${versionTag}.`
          : 'Firmware flash started. Device may reboot.',
      });
      setDownloadedGitHubFirmware(null);
      setLastChecksumResult(null);
      setDownloadMessage(null);
    } catch (err) {
      setFlashMessage({ type: 'error', text: err.message });
    } finally {
      setFlashingFirmware(false);
    }
  };

  const handleFlashFirmware = async () => {
    if (!firmwareFile) {
      setFlashMessage({ type: 'error', text: 'Select a firmware file first.' });
      return;
    }
    setFlashingFirmware(true);
    setFlashMessage(null);
    try {
      await flashFirmwareFile(firmwareFile, 'firmware');
      setFlashMessage({
        type: 'success',
        text: 'Firmware flash started. Device may reboot. Success can only be confirmed after it comes back online.',
      });
      setFirmwareFile(null);
    } catch (err) {
      setFlashMessage({ type: 'error', text: err.message });
    } finally {
      setFlashingFirmware(false);
    }
  };

  const handleFlashWww = async () => {
    if (!wwwFile) {
      setFlashMessage({ type: 'error', text: 'Select a www file first.' });
      return;
    }
    setFlashingWww(true);
    setFlashMessage(null);
    try {
      await flashFirmwareFile(wwwFile, 'www');
      setFlashMessage({
        type: 'success',
        text: 'WWW upload started. Device may reboot. Success can only be confirmed after it comes back online.',
      });
      setWwwFile(null);
    } catch (err) {
      setFlashMessage({ type: 'error', text: err.message });
    } finally {
      setFlashingWww(false);
    }
  };

  const disabled = !!minerError;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Release & Update */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Release & Update</h3>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Current version">
            <span className="text-normal text-sm font-medium">{currentVersion}</span>
          </Field>
          <Field label="Select release" hint="Choose a release to install. Checksum is verified before flashing.">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRelease?.tag_name ?? ''}
                onChange={(e) => {
                  const r = releases.find((x) => x.tag_name === e.target.value);
                  setSelectedRelease(r || null);
                }}
                disabled={loadingReleases || disabled}
                className="input flex-1 min-w-0"
                aria-label="Select release"
              >
                {loadingReleases && (
                  <option value="">Loading…</option>
                )}
                {!loadingReleases && releases.map((r) => (
                  <option key={r.tag_name} value={r.tag_name}>
                    {r.tag_name}{releases[0]?.tag_name === r.tag_name ? ' (latest)' : ''}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-normal whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrereleases}
                  onChange={(e) => setShowPrereleases(e.target.checked)}
                  disabled={loadingReleases}
                  className="checkbox-input"
                />
                <span className="checkbox-box" aria-hidden>
                  <svg
                    className="checkbox-check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12l5 5 9-9" />
                  </svg>
                </span>
                Show pre-releases
              </label>
            </div>
          </Field>
          <Field label="Published">
            <span className="text-normal text-sm">{published}</span>
          </Field>
          <Field label="Filename">
            <span className="text-normal text-sm font-mono break-all">{filename}</span>
          </Field>
          {selectedRelease?.html_url && (
            <p>
              <a href={selectedRelease.html_url} target="_blank" rel="noopener noreferrer" className="text-accent text-sm">
                View Changelog
              </a>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDownloadConfirmModal(true)}
              disabled={disabled || downloading || !downloadUrl || loadingReleases || isSameVersionAsInstalled}
              className="btn-primary inline-flex items-center gap-2"
            >
              <IconDownload className="w-4 h-4 shrink-0" />
              {downloading ? 'Downloading…' : 'Download from GitHub'}
            </button>
            <button
              type="button"
              onClick={handleFlashDownloadedFirmware}
              disabled={disabled || flashingFirmware || !downloadedGitHubFirmware}
              className="btn-ghost-accent"
            >
              {flashingFirmware ? 'Flashing…' : 'Flash'}
            </button>
          </div>
          {expectedSha256 && !lastChecksumResult && (
            <p className="text-xs text-muted">
              Checksum will be verified (SHA256) after download.
            </p>
          )}
          <p className="text-xs text-muted">
            Download the firmware first; verification is shown below. Then click Flash to install. Errors (e.g. checksum mismatch or miner unreachable) are shown below. The dashboard does not control how the miner handles a failed OTA; many devices keep the previous firmware and reboot back to it on failure.
          </p>
          {lastChecksumResult && (
            <div className="rounded-md border border-default bg-surface-subtle px-3 py-2 text-xs font-mono space-y-1">
              <div className="font-semibold text-normal">Checksum verification</div>
              {lastChecksumResult.mismatch ? (
                <p className="text-danger dark:text-danger-dark">Mismatch: file does not match expected SHA256.</p>
              ) : lastChecksumResult.checksumVerified ? (
                <p className="text-success dark:text-success-dark">Verified (SHA256).</p>
              ) : (
                <p className="text-muted">No checksum file in release; download proceeded without verification.</p>
              )}
              {lastChecksumResult.computedSha256 != null && (
                <div>
                  <span className="text-muted">Computed: </span>
                  <span className="text-normal break-all">{lastChecksumResult.computedSha256}</span>
                </div>
              )}
              {lastChecksumResult.expectedSha256 != null && (
                <div>
                  <span className="text-muted">Expected: </span>
                  <span className="text-normal break-all">{lastChecksumResult.expectedSha256}</span>
                </div>
              )}
            </div>
          )}
          {downloadMessage && (
            <p
              role="alert"
              className={`text-sm ${downloadMessage.type === 'error' ? 'text-danger dark:text-danger-dark' : 'text-success dark:text-success-dark'}`}
            >
              {downloadMessage.text}
            </p>
          )}
          {flashMessage && (
            <p
              role="alert"
              className={`text-sm ${flashMessage.type === 'error' ? 'text-danger dark:text-danger-dark' : 'text-success dark:text-success-dark'}`}
            >
              {flashMessage.text}
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDownloadConfirmModal}
        onClose={() => setShowDownloadConfirmModal(false)}
        title="Download firmware?"
        description={
          <>
            Download <strong>{selectedRelease?.tag_name ?? 'selected release'}</strong> from GitHub?
            <br />
            File: <span className="font-mono text-sm">{filename}</span>
            <br />
            {expectedSha256
              ? 'Checksum (SHA256) will be verified after download. Flash will be enabled only after a successful download.'
              : 'No checksum file for this release; download will proceed without verification.'}
          </>
        }
        confirmLabel="Download"
        onConfirm={handleDownloadFromGitHub}
        confirmDisabled={downloading}
      />

      {/* Legacy Update */}
      <div className="card">
        <div className="card-header-wrapper">
          <div className="card-header">
            <h3 className="card-header-title">Legacy Update</h3>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h4 className="card-title">Manual Firmware Upload</h4>
            <p className="text-xs text-muted mb-2">
              Upload a firmware .bin file (e.g. esp-miner-NerdQAxe++.bin) from your computer. Use this when you have a local build or a file from a source other than GitHub. No checksum verification is performed, ensure the file is from a trusted source. The device may reboot after flashing.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-ghost-accent cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm">
                <span>Browse</span>
                <input
                  type="file"
                  accept=".bin"
                  className="sr-only"
                  key={firmwareFile ? 'f' : 'empty-f'}
                  onChange={(e) => setFirmwareFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                type="button"
                onClick={handleFlashFirmware}
                disabled={disabled || flashingFirmware || !firmwareFile}
                className="btn-ghost-accent"
              >
                {flashingFirmware ? 'Flashing…' : 'Flash'}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">Accepted: .bin (e.g. esp-miner-NerdQAxe++.bin)</p>
          </div>
          <div>
            <h4 className="card-title">Manual WWW Upload</h4>
            <p className="text-xs text-muted mb-2">
              Upload a packed web UI .bin file (e.g. www.bin) to update only the dashboard/UI on the device without changing the miner firmware. Useful for updating the web interface from a custom or pre-built www bundle. No checksum verification is performed.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-ghost-accent cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm">
                <span>Browse</span>
                <input
                  type="file"
                  accept=".bin"
                  className="sr-only"
                  key={wwwFile ? 'w' : 'empty-w'}
                  onChange={(e) => setWwwFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                type="button"
                onClick={handleFlashWww}
                disabled={disabled || flashingWww || !wwwFile}
                className="btn-ghost-accent"
              >
                {flashingWww ? 'Flashing…' : 'Flash'}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">Accepted: .bin (e.g. www.bin)</p>
          </div>
          {flashMessage && (
            <p
              role="alert"
              className={`text-sm ${flashMessage.type === 'error' ? 'text-danger dark:text-danger-dark' : 'text-success dark:text-success-dark'}`}
            >
              {flashMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
