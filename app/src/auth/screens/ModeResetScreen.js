import React, { useEffect } from "react";

import { useSession } from "../session";
import { LoadingState, Screen } from "../../ui/components";

export function ModeResetScreen() {
  const { switchMode } = useSession();

  useEffect(() => {
    switchMode(null);
  }, [switchMode]);

  return (
    <Screen>
      <LoadingState label="Returning to mode selection..." />
    </Screen>
  );
}
