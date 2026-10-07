/**
 * Optional Artemis hook for the "Trading vs payments" panel. DOCUMENTED STUB.
 *
 * The brief asked for ARTEMIS_STABLECOIN_TRANSFER_VOLUME (Artemis-filtered, i.e.
 * adjusted, transfer volume) when ARTEMIS_API_KEY is set. As of 6 Oct 2026:
 * - Its API reference page (.../fetch-artemis-filtered-stablecoin-transfer-volume) returns 404.
 * - Artemis' "Stablecoin Metrics Methodology - July 2026" says the ARTEMIS_* and P2P_*
 *   stablecoin flavours are no longer supported and are being removed, and that the
 *   remaining STABLECOIN_TRANSFER_VOLUME is now GROSS (only mints and burns excluded).
 *   https://artemis.ai/docs/data-reference/stablecoin-methodology
 *
 * The request shape for the adjusted metric could not be confirmed, and the gross metric
 * measures something different from the curated "adjusted" figure, so this returns null
 * and the panel keeps the curated Visa numbers. If Artemis reintroduces an adjusted
 * measure, implement it here and return the trailing 30-day sum in USD.
 */
export async function fetchArtemisAdjustedVolume30d(): Promise<number | null> {
  const apiKey = process.env.ARTEMIS_API_KEY;
  if (!apiKey) return null;
  // Key present, but there is no confirmed adjusted endpoint to call (see note above).
  return null;
}
