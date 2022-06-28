import { PublicKey } from "@dxos/crypto";
import { Credential, DeviceClaim } from "../proto";

export interface DevicesState {
  identity: PublicKey
  devices: {
    key: PublicKey
    addedBy: PublicKey
  }[]
}

export function createNewState(identity: PublicKey): DevicesState {
  return {
    identity,
    devices: [],
  }
}

export function processCredential(state: DevicesState, credential: Credential): DevicesState {
  switch(credential.claim['@type']) {
    case 'dxos.halo.credentials.DeviceClaim': {
      const claim = credential.claim as DeviceClaim
      
      const issuer = credential.signatures?.find(sig => 
        sig.signer?.equals(state.identity) ||
        state.devices.some(device => device.key.equals(sig.signer!))
        )
      if(!issuer) return state

      return {
        ...state,
        devices: [
          ...state.devices,
          {
            key: claim.device!,
            addedBy: issuer.signer!,
          }
        ]
      }
    }
    default:
      return state
  }
}