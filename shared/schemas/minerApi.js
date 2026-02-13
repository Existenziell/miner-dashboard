/**
 * Shared API schema for the miner dashboard.
 * Single source of truth for request/response shapes so client and server stay in sync.
 *
 * Used by:
 * - Server: validate PATCH /api/miner/settings body before forwarding to miner
 * - Client: validate payload before send and parse responses
 */

import { z } from 'zod';

// --- Constants (match server validation) ---
const MAX_HOSTNAME_LENGTH = 64;
const MAX_WIFI_SSID_LENGTH = 32;
const MIN_WIFI_PASSWORD_LENGTH = 8;
const MAX_WIFI_PASSWORD_LENGTH = 63;
const MAX_STRATUM_URL_LENGTH = 512;
const MAX_STRATUM_USER_LENGTH = 128;
const MAX_STRATUM_PASSWORD_LENGTH = 128;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const POOL_MODE_VALUES = ['failover', 'dual', '0', '1'];
const HOSTNAME_REGEX = /^[a-zA-Z0-9-]*$/;

// --- Helpers ---
const optionalNum = () => z.number().finite().optional();
const portNum = () => z.number().int().min(MIN_PORT).max(MAX_PORT).optional();
const boolOr01 = () =>
  z
    .union([z.boolean(), z.literal(0), z.literal(1)])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === true || v === 1;
    });

/**
 * Schema for PATCH /api/miner/settings request body.
 * All fields optional; only provided keys are validated and forwarded to the miner.
 * Unknown keys are stripped.
 */
export const minerSettingsPatchSchema = z
  .object({
    // ASIC
    frequency: optionalNum(),
    coreVoltage: optionalNum(),
    overheat_temp: optionalNum(),
    // Miner: 0 = manual, 2 = auto (PID). Value 1 may be legacy or other mode.
    autofanspeed: z.union([z.literal(0), z.literal(1), z.literal(2), z.boolean()]).optional().transform((v) => {
      if (v === undefined) return undefined;
      if (v === true || v === 2) return 2;
      if (v === 1) return 1;
      return 0;
    }),
    pidTargetTemp: optionalNum(),
    manualFanSpeed: optionalNum(),
    // Display
    autoscreenoff: boolOr01(),
    flipscreen: boolOr01(),
    // WiFi
    hostname: z
      .string()
      .max(MAX_HOSTNAME_LENGTH)
      .regex(HOSTNAME_REGEX, 'alphanumeric and hyphens only')
      .optional()
      .or(z.literal('')),
    ssid: z.string().max(MAX_WIFI_SSID_LENGTH).optional().or(z.literal('')),
    wifiPass: z
      .string()
      .min(MIN_WIFI_PASSWORD_LENGTH, { message: `when set, length must be ${MIN_WIFI_PASSWORD_LENGTH}-${MAX_WIFI_PASSWORD_LENGTH}` })
      .max(MAX_WIFI_PASSWORD_LENGTH)
      .optional()
      .or(z.literal('')),
    // Pool primary
    stratumURL: z.string().max(MAX_STRATUM_URL_LENGTH).optional().or(z.literal('')),
    stratumPort: portNum(),
    stratumUser: z.string().max(MAX_STRATUM_USER_LENGTH).optional().or(z.literal('')),
    stratumPassword: z.string().max(MAX_STRATUM_PASSWORD_LENGTH).optional().or(z.literal('')),
    stratumTLS: boolOr01(),
    stratumTcpKeepalive: boolOr01(),
    stratum_keep: boolOr01(),
    stratumExtranonceSubscribe: boolOr01(),
    stratumEnonceSubscribe: boolOr01(),
    // Pool fallback
    fallbackStratumURL: z.string().max(MAX_STRATUM_URL_LENGTH).optional().or(z.literal('')),
    fallbackStratumPort: portNum(),
    fallbackStratumUser: z.string().max(MAX_STRATUM_USER_LENGTH).optional().or(z.literal('')),
    fallbackStratumPassword: z.string().max(MAX_STRATUM_PASSWORD_LENGTH).optional().or(z.literal('')),
    fallbackStratumTLS: boolOr01(),
    fallbackStratumExtranonceSubscribe: boolOr01(),
    fallbackStratumEnonceSubscribe: boolOr01(),
    poolMode: z
      .union([z.enum(POOL_MODE_VALUES), z.literal('')])
      .optional()
      .transform((v) => (v === undefined || v === null ? undefined : (v === '' ? 'failover' : v))),
  })
  .strip(); // only known keys; unknown keys are dropped so we don't forward them to the miner

/** Validate and sanitize a partial settings object. Returns { success, payload, error } for server use. */
export function parseMinerSettings(body) {
  const parsed = minerSettingsPatchSchema.safeParse(body ?? {});
  if (parsed.success) {
    const data = parsed.data;
    const payload = {};
    for (const key of Object.keys(data)) {
      const v = data[key];
      if (v !== undefined && v !== '') payload[key] = v;
    }
    return { success: true, payload, error: null };
  }
  const flat = parsed.error.flatten();
  const parts = [...flat.formErrors];
  for (const [k, v] of Object.entries(flat.fieldErrors || {})) {
    parts.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  }
  return { success: false, payload: null, error: parts.join('; ') };
}
