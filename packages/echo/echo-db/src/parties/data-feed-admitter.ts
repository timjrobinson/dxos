import { createFeedAdmitMessage } from "@dxos/credentials";
import { PartyPipeline } from "../pipeline";
import { CredentialsSigner } from "../protocol";

export function admitDataFeed(partyPipeline: PartyPipeline, credentialsSigner: CredentialsSigner) {
  setImmediate(async () => {
    if (!partyPipeline.isOpen) return
    await partyPipeline.processor.keyOrInfoAdded.waitForCondition(() => 
      partyPipeline.processor.isMemberKey(credentialsSigner.getIdentityKey().publicKey)
    )

    if (!partyPipeline.isOpen) return
    const dataFeed = await partyPipeline.getDataFeed();
    if (!partyPipeline.processor.isFeedAdmitted(dataFeed.key)) {
      if (!partyPipeline.isOpen) return
      await partyPipeline.credentialsWriter.write(createFeedAdmitMessage(
        credentialsSigner.signer,
        partyPipeline.key,
        dataFeed.key,
        [credentialsSigner.getDeviceSigningKeys()],
      ));
    }
  })
}