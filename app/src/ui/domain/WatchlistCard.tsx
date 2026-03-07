import React from "react";

import { Button } from "../components";
import { GigCard } from "./GigCard";

export function WatchlistCard({
  gig,
  onOpen,
  onClaim,
  onRemove,
  claimLoading = false,
  removeLoading = false,
  claimDisabled = false,
}) {
  return (
    <GigCard gig={gig} watched showCountdown={false} width={null} onPress={onOpen}>
      <Button
        label="Claim Gig"
        onPress={onClaim}
        loading={claimLoading}
        disabled={claimDisabled || claimLoading || removeLoading}
        style={{ marginTop: 12 }}
      />
    </GigCard>
  );
}
