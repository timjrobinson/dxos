import { PublicKey } from "@dxos/keys";

export const formatDid = (key: PublicKey) => {
  // TODO(dmaretskyi): Base58.
  return `did:dxos:${key.toHex()}`;
}