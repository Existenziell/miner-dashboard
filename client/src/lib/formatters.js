import { RESET_REASONS } from '@/lib/constants.js';

/**
 * Format hashrate to human-readable string.
 * Input is in GH/s from the miner API.
 */
export function formatHashrate(ghps) {
  if (ghps == null) return '--';
  if (ghps >= 1000) return `${(ghps / 1000).toFixed(2)} TH/s`;
  if (ghps >= 1) return `${ghps.toFixed(2)} GH/s`;
  return `${(ghps * 1000).toFixed(1)} MH/s`;
}

/**
 * Format uptime from seconds to human-readable string.
 */
export function formatUptime(seconds) {
  if (seconds == null) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Format temperature with unit.
 */
export function formatTemp(temp) {
  if (temp == null) return '--';
  return `${temp.toFixed(1)}°C`;
}

/**
 * Format power in watts.
 */
export function formatPower(watts) {
  if (watts == null) return '--';
  return `${watts.toFixed(1)} W`;
}

/**
 * Format byte count for display (avoids locale-dependent thousands separators).
 * Uses decimal units (KB, MB, GB) for consistency with other dashboard units.
 */
export function formatBytes(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return '--';
  const n = Number(bytes);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KB`;
  return `${n} B`;
}

/**
 * Format block weight (weight units) as MW (million WU).
 */
export function formatWeight(wu) {
  if (wu == null || !Number.isFinite(wu)) return '--';
  const n = Number(wu);
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MW`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KW`;
  return `${n} WU`;
}

/**
 * Format large numbers with commas.
 */
export function formatNumber(num) {
  if (num == null) return '--';
  return Number(num).toLocaleString();
}

/**
 * Format difficulty to human-readable (e.g., 146.5T).
 */
export function formatDifficulty(diff) {
  if (diff == null) return '--';
  if (diff >= 1e15) return `${(diff / 1e15).toFixed(2)} P`;
  if (diff >= 1e12) return `${(diff / 1e12).toFixed(2)} T`;
  if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)} G`;
  if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)} M`;
  return formatNumber(diff);
}

/**
 * Format BTC price with currency symbol.
 */
export function formatPrice(usd) {
  if (usd == null) return '--';
  return `$${Number(usd).toLocaleString()}`;
}

/**
 * Format a best difficulty value with appropriate suffix.
 */
export function formatBestDiff(diff) {
  if (diff == null) return '--';
  if (diff >= 1e9) return `${(diff / 1e9).toFixed(2)}G`;
  if (diff >= 1e6) return `${(diff / 1e6).toFixed(2)}M`;
  if (diff >= 1e3) return `${(diff / 1e3).toFixed(2)}K`;
  return formatNumber(diff);
}

/**
 * Format Unix timestamp as relative time (e.g. "5 min ago", "1 hour ago").
 */
export function formatTimeAgo(unixTs) {
  if (unixTs == null || !Number.isFinite(Number(unixTs))) return '--';
  const sec = Math.floor(Date.now() / 1000) - Number(unixTs);
  if (sec < 0) return 'just now';
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}

/**
 * Format the raw reset reason string into a human-readable label.
 * Falls back to the raw string if unrecognised.
 */
export function formatResetReason(raw) {
  if (!raw) return '--';
  return RESET_REASONS[raw] ?? raw;
}

/**
 * Format a hash as a string of the first 3 and last 6 characters.
 */
export function formatHash(id) {
  if (id == null) return '--';
  return `${id.slice(0, 3)}...${id.slice(-6)}`;
}

/**
 * Obfuscate only the address (first segment) of a Stratum user string.
 * Handles: Address, Address.Worker, Address.RIG_ID, user.worker, etc.
 */
export function formatStratumUser(user) {
  if (user == null || String(user).trim() === '') return '--';
  const s = String(user).trim();
  const idx = s.indexOf('.');
  const addressPart = idx === -1 ? s : s.slice(0, idx);
  const suffix = idx === -1 ? '' : s.slice(idx);

  if (addressPart.length <= 10) return addressPart + suffix;
  const obfuscated = `${addressPart.slice(0, 4)}...${addressPart.slice(-6)}`;
  return obfuscated + suffix;
}

/**
 * Obfuscate a MAC address to first octet + **:**:**:**:** + last octet.
 * Accepts colon or hyphen-separated format (e.g. AC:A7:04:1F:F6:6C -> AC:**:**:**:**:6C).
 * Always returns colon-separated form when obfuscating.
 */
export function obfuscateMac(mac) {
  if (mac == null || String(mac).trim() === '') return '--';
  const s = String(mac).trim();
  const sep = s.includes('-') ? '-' : ':';
  const octets = s.split(sep).filter(Boolean);
  if (octets.length !== 6) return s;
  return `${octets[0]}:00:00:00:00:${octets[5]}`;
}