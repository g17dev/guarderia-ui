import type { ReceptionChild, ReceptionAdult, ReceptionGateway } from "../child-handover/reception.ts";
import { createReceptionSimulation } from "../child-handover/receptionSimulation.ts";
import type { Scenario } from "./labData";

// Lab-only fault injection. All successful writes still pass the shared adapter.
export function createLabSimulation(children: ReceptionChild[], adults: ReceptionAdult[], scenario: Scenario, delays = { verificationDelayMs: 700, saveDelayMs: 400 }): ReceptionGateway {
  const base = createReceptionSimulation(children, adults, { ...delays,
    getFingerprintAdultId: () => scenario === "rejected" ? "demo-no-permission" : undefined,
  });
  let loseFirstResponse = scenario === "save-error";
  return { ...base,
    async identify(request) {
      if (scenario === "offline") throw new Error("El lector está desconectado. Revisa la conexión y vuelve a intentar. La selección se conserva.");
      return base.identify!(request);
    },
    async save(request) {
      const result = await base.save(request);
      if (loseFirstResponse) { loseFirstResponse = false; throw new Error("Respuesta interrumpida"); }
      return result;
    },
  };
}
