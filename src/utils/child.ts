const COLORS = [
  "var(--avatar-peach)",
  "var(--avatar-lilac)",
  "var(--avatar-blue)",
  "var(--avatar-sage)",
  "var(--avatar-sand)",
  "var(--avatar-teal)",
];

export function getAvatarColor(name: string, lastName: string): string {
  const str = `${name}${lastName}`;
  const hash = Array.from(str).reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  );
  return COLORS[hash % COLORS.length];
}

export function getInitials(name: string, lastName: string): string {
  return (`${name.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}` || "?").toUpperCase();
}

export function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const notHadBirthdayYet =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return notHadBirthdayYet ? age - 1 : age;
}

export function generateSlug(name: string, lastName: string): string {
  return `${name}-${lastName}`
    .toLowerCase()
    .normalize("NFD")                        // descompone acentos
    .replace(/[\u0300-\u036f]/g, "")         // elimina los acentos
    .replace(/[^a-z0-9]+/g, "-")            // reemplaza caracteres especiales
    .replace(/^-|-$/g, "");                  // quita guiones al inicio/fin
}
