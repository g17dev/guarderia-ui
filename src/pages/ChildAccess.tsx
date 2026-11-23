import { useState } from "react";
import { ReceptionScreen } from "../features/child-handover/ReceptionScreen";
import { createReceptionSimulation } from "../features/child-handover/receptionSimulation";
import type { SimulationOutcome } from "../features/child-handover/receptionSimulation";
import { RECEPTION_EXAMPLE_ADULTS, RECEPTION_EXAMPLE_CHILDREN } from "../features/child-handover/receptionFixtures";

export default function ChildAccess() {
  const [preview] = useState(() => {
    let outcome: SimulationOutcome = "authorized";
    return {
      gateway: createReceptionSimulation(RECEPTION_EXAMPLE_CHILDREN, RECEPTION_EXAMPLE_ADULTS, {
        getFingerprintAdultId: () => outcome === "unauthorized" ? "demo-unauthorized-fingerprint" : undefined,
      }),
      changeOutcome: (value: SimulationOutcome) => { outcome = value; },
    };
  });
  return <ReceptionScreen gateway={preview.gateway} adults={RECEPTION_EXAMPLE_ADULTS} onSimulationOutcomeChange={preview.changeOutcome} />;
}
