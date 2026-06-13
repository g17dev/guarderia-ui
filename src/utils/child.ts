const COLORS = [
  "#E07B3A", // naranja — tu #FFDDB5 pero más saturado
  "#D4845A", // durazno oscuro
  "#C0674F", // terracota
  "#9B6B9E", // lavanda oscura
  "#6B7FC4", // azul pizarra
  "#5B9E8F", // verde azulado
  "#7BAD6E", // verde salvia
  "#C4956A", // camel
  "#B07EB8", // malva
  "#6BAED4", // azul cielo medio
  "#D4A96A", // dorado arena
  "#8FA86B", // verde olivo
];

export function getAvatarColor(name: string, lastName: string): string {
  const str = `${name}${lastName}`;
  const hash = Array.from(str).reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  );
  return COLORS[hash % COLORS.length];
}

export function getInitials(name: string, lastName: string): string {
  return `${name[0]}${lastName[0]}`.toUpperCase();
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