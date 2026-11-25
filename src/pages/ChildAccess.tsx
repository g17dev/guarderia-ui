import { ReceptionScreen } from "../features/child-handover/ReceptionScreen";
import { RECEPTION_EXAMPLE_ADULTS } from "../features/child-handover/receptionFixtures";
import { operationalSimulation, useOperationalSimulation } from "../features/child-handover/operationalSimulation";

export default function ChildAccess() {
  const state = useOperationalSimulation();
  return <ReceptionScreen sharedState={state} gateway={operationalSimulation.gateway} adults={RECEPTION_EXAMPLE_ADULTS} onSimulationOutcomeChange={operationalSimulation.changeOutcome} onSimulateSaveError={operationalSimulation.failNextSave} />;
}
