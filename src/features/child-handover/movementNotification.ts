import type { Authorization, MovementReceipt, ReceptionAdult, ReceptionChild } from "./reception";

const relations: Partial<Record<string, string>> = {
  madre: "su mamá", mama: "su mamá", mother: "su mamá",
  padre: "su papá", papa: "su papá", father: "su papá",
  abuela: "su abuela", grandmother: "su abuela",
  abuelo: "su abuelo", grandfather: "su abuelo",
  tia: "su tía", aunt: "su tía", tio: "su tío", uncle: "su tío",
  legal: "su responsable legal", "tutor legal": "su responsable legal", "tutora legal": "su responsable legal",
};

function familiarRelation(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .trim().replace(/\s+/g, " ").replace(/ autorizad[oa]$/, "");
  return relations[normalized];
}

type NamedChild = Pick<ReceptionChild, "id" | "name" | "lastName">;

function childNames(children: NamedChild[]) {
  if (!children.length) return "El grupo";
  if (children.length > 2) return `Los ${children.length} niños`;
  const short = children.map(child => {
    const surname = child.lastName.trim();
    const firstSurname = /^(de|del|la|las|los|san|santa|da|dos|van|von)\b/i.test(surname)
      ? surname : surname.split(/\s+/)[0];
    return `${child.name.trim()} ${firstSurname}`.trim();
  });
  const names = new Set(short).size === short.length ? short
    : children.map(child => `${child.name} ${child.lastName}`.trim());
  return names.join(" y ");
}

export function getMovementNotification({ receipt, children, adult, adultProfile, timeZone, reentry = false }: {
  receipt: MovementReceipt;
  children: NamedChild[];
  adult: Authorization["adult"];
  adultProfile?: ReceptionAdult;
  timeZone?: string;
  reentry?: boolean;
}) {
  const childRelations = children.map(child => {
    if (adultProfile?.id !== receipt.adultId || adult.id !== receipt.adultId) return undefined;
    const matches = adultProfile.permissions.filter(permission => permission.childId === child.id && permission.actions.includes(receipt.action));
    const roles = matches.map(permission => familiarRelation(permission.relationship));
    return roles.length && roles[0] && roles.every(role => role === roles[0]) ? roles[0] : undefined;
  });
  // Family wording is safe only when this same adult has the same known
  // relationship to every child. Mixed/unknown roles use the identified name.
  const sharedRelation = childRelations.length && childRelations[0]
    && childRelations.every(relation => relation === childRelations[0]) ? childRelations[0] : undefined;
  const companion = sharedRelation ?? adult.name;
  const plural = children.length > 1;
  const phrase = receipt.action === "entry"
    ? reentry ? plural ? "regresaron con" : "regresó con" : plural ? "llegaron con" : "llegó con"
    : plural ? "se retiraron en compañía de" : "se retiró en compañía de";
  const savedAt = new Date(receipt.savedAt);
  const formatter = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone });
  const time = formatter.format(savedAt);
  const hour = formatter.formatToParts(savedAt).find(part => part.type === "hour")?.value;
  const at = Number(hour) === 1 ? "a la" : "a las";

  return {
    title: receipt.action === "entry" && reentry ? "Reingreso registrado con éxito" : `${receipt.action === "entry" ? "Entrada" : "Salida"} registrada con éxito`,
    description: `${childNames(children)} ${phrase} ${companion} ${at} ${time}${time.endsWith(".") ? "" : "."}`,
  };
}
