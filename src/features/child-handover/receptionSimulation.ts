import {
  canMove, getCompatibleAdults, isAuthorized, ReceptionAuthorizationError,
  type Authorization, type MovementRequest, type MovementReceipt, type ReceptionAdult, type ReceptionChild, type ReceptionGateway,
} from "./reception.ts";

export type SimulationOutcome = "authorized" | "unauthorized";

// Explicit preview adapter: no hardware, network, localStorage, or real records.
// Keep the real gateway separate; never treat these tokens as biometric evidence.
export function createReceptionSimulation(
  initialChildren: ReceptionChild[],
  adults: ReceptionAdult[],
  { verificationDelayMs = 1200, saveDelayMs = 650, fingerprintAdultId, getFingerprintAdultId }: {
    verificationDelayMs?: number; saveDelayMs?: number; fingerprintAdultId?: string;
    getFingerprintAdultId?: () => string | undefined;
  } = {},
): ReceptionGateway {
  const children = new Map(initialChildren.map(child => [child.id, { ...child }]));
  const authorizations = new Map<string, Authorization>();
  const receipts = new Map<string, { token: string; receipt: MovementReceipt }>();
  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  function selectedChildren(ids: string[]) {
    if (!ids.length || new Set(ids).size !== ids.length) throw new Error("Revisa la selección de niños.");
    return ids.map(id => {
      const child = children.get(id);
      if (!child) throw new Error("Un niño de la selección ya no está disponible.");
      return child;
    });
  }

  async function simulateReading(request: MovementRequest, sampledAdultId?: string) {
    await delay(verificationDelayMs);
    if (!canMove(selectedChildren(request.childIds), request.action)) {
      throw new Error("El movimiento ya no es compatible con todos los niños seleccionados.");
    }
    const adult = getCompatibleAdults(adults, request).find(candidate => candidate.id === sampledAdultId);
    if (!adult) throw new Error("El adulto no tiene autorización para todos los niños de esta selección.");
    const result: Authorization = {
      childIds: [...request.childIds], action: request.action,
      token: `demo-authorization-${crypto.randomUUID()}`,
      adult: { id: adult.id, name: adult.name, photoUrl: adult.photoUrl },
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      permissions: request.childIds.map(childId => ({ childId, authorized: true })),
    };
    authorizations.set(result.token, result);
    return structuredClone(result);
  }

  return {
    mode: "simulation",
    async identify(request) {
      const candidates = getCompatibleAdults(adults, request).filter(adult => request.candidateAdultIds.includes(adult.id));
      // Preview-only fixture response, NOT a fingerprint matcher. A real adapter
      // must identify the captured fingerprint within the authorized gallery.
      const sampledId = fingerprintAdultId ?? getFingerprintAdultId?.() ?? candidates[0]?.id;
      if (!sampledId || !candidates.some(adult => adult.id === sampledId)) {
        await delay(verificationDelayMs);
        throw new ReceptionAuthorizationError("La huella no corresponde a un adulto autorizado para todo el grupo.");
      }
      return simulateReading(request, sampledId);
    },
    async verify(request) {
      if (fingerprintAdultId && fingerprintAdultId !== request.adultId) {
        await delay(verificationDelayMs);
        throw new Error("La huella no coincide con el adulto seleccionado. Vuelve a intentar.");
      }
      return simulateReading(request, request.adultId);
    },
    async save(request) {
      await delay(saveDelayMs);
      const existing = receipts.get(request.idempotencyKey);
      if (existing) {
        if (existing.token !== request.authorizationToken || existing.receipt.action !== request.action
          || existing.receipt.childIds.length !== request.childIds.length
          || !existing.receipt.childIds.every(id => request.childIds.includes(id))
          || new Set(request.childIds).size !== request.childIds.length) {
          throw new Error("El identificador del registro pertenece a otro movimiento.");
        }
        return structuredClone(existing.receipt);
      }
      const authorization = authorizations.get(request.authorizationToken);
      if (!request.idempotencyKey || !authorization || !isAuthorized(authorization, request)
        || !getCompatibleAdults(adults, request).some(adult => adult.id === authorization.adult.id)) {
        throw new Error("Vuelve a verificar la huella del adulto antes de registrar.");
      }
      const selected = selectedChildren(request.childIds);
      if (!canMove(selected, request.action)) throw new Error("Revisa el estado de todos los niños antes de registrar.");
      const receipt: MovementReceipt = {
        id: `demo-movement-${crypto.randomUUID()}`, action: request.action,
        childIds: [...request.childIds], adultId: authorization.adult.id, savedAt: new Date().toISOString(),
      };
      // Validate the complete group before updating any child, without awaiting
      // between validation and update. Retries recover the same in-memory receipt.
      selected.forEach(child => children.set(child.id, {
        ...child, attendanceStatus: request.action === "entry" ? "inside" : "out",
      }));
      receipts.set(request.idempotencyKey, { token: request.authorizationToken, receipt });
      authorizations.delete(request.authorizationToken);
      return structuredClone(receipt);
    },
  };
}
