import { useEffect, useRef, type ReactNode } from "react";
import { Heart, UserRound, UsersRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getProfileAuthorizedAdults, getProfileHealth, type ProfileChild } from "./childProfile";
import { SpecialCareDetails } from "./SpecialCareDetails";

const relationships: Record<string, string> = { father: "Padre", mother: "Madre", grandfather: "Abuelo", grandmother: "Abuela", uncle: "Tío", aunt: "Tía", legal: "Tutor legal", other: "Otro" };
function Detail({ label, children }: { label: string; children?: ReactNode }) {
  return <div className="profile-detail"><dt>{label}</dt><dd>{children || <span className="profile-unspecified">No registrado</span>}</dd></div>;
}

export function ProfileInformation({ child, careRequest = 0, onEditCare }: { child: ProfileChild; careRequest?: number; onEditCare: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const careSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (careRequest <= 0 || !container.current || !careSection.current) return;
    careSection.current.focus({ preventScroll: true });
    container.current.scrollTo({ top: careSection.current.offsetTop, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [careRequest]);
  const health = getProfileHealth(child);
  const authorizedAdults = getProfileAuthorizedAdults(child);
  return <div className="profile-information" ref={container}>
    <section className="profile-detail-section">
      <h3><UserRound size={18} aria-hidden="true" />Datos personales</h3>
      <dl className="profile-details-grid">
        <Detail label="Nombre completo">{child.name} {child.lastName}</Detail>
        {child.lastNamePaternal && <Detail label="Apellido paterno">{child.lastNamePaternal}</Detail>}
        {child.lastNameMaternal && <Detail label="Apellido materno">{child.lastNameMaternal}</Detail>}
        <Detail label="Fecha de nacimiento">{format(parseISO(child.birthDate), "d 'de' MMMM 'de' yyyy", { locale: es })}</Detail>
        <Detail label="Género">{child.gender === "female" ? "Niña" : child.gender === "male" ? "Niño" : undefined}</Detail>
        <Detail label="Grupo">{child.classroom}</Detail>
        <Detail label="Fecha de inscripción">{format(parseISO(child.enrollmentDate), "d 'de' MMMM 'de' yyyy", { locale: es })}</Detail>
      </dl>
    </section>
    <section className="profile-detail-section">
      <h3><UsersRound size={18} aria-hidden="true" />Adultos responsables y contacto</h3>
      {child.responsibleAdults?.length ? child.responsibleAdults.map(adult => <div className="profile-responsible" key={adult.id}>
        <h4>{[adult.name, adult.lastNamePaternal, adult.lastNameMaternal].filter(Boolean).join(" ")}</h4>
        <dl className="profile-details-grid">
          <Detail label="Parentesco">{relationships[adult.relationship]}</Detail>
          <Detail label="CURP">{adult.curp}</Detail><Detail label="INE">{adult.ine}</Detail>
          <Detail label="Teléfonos">{adult.phones.filter(phone => phone.number).map(phone => <span className="profile-detail-line" key={phone.id}>{phone.number}{phone.note ? ` · ${phone.note}` : ""}</span>)}</Detail>
          <Detail label="Domicilio">{[adult.street, adult.neighborhood, adult.city, adult.state, adult.zipCode].filter(Boolean).join(", ")}</Detail>
        </dl>
      </div>) : <dl className="profile-details-grid">
        <Detail label="Nombre">{child.tutor.name} {child.tutor.lastName}</Detail>
        <Detail label="Parentesco">{child.tutor.relationship}</Detail>
        <Detail label="Teléfono"><a href={`tel:${child.tutor.phone}`}>{child.tutor.phone}</a></Detail>
        <Detail label="Domicilio" /><Detail label="CURP" /><Detail label="INE" />
      </dl>}
    </section>
    <section className="profile-detail-section">
      <h3><UsersRound size={18} aria-hidden="true" />Autorización de recogida</h3>
      {authorizedAdults.length ? <div className="profile-pickup-overview">{authorizedAdults.map(adult => <div key={adult.id}><span><strong>{adult.name}</strong><small>{adult.relationship}{adult.phone ? ` · ${adult.phone}` : ""}</small></span><span className={`profile-adult-permission ${adult.canPickup ? "allowed" : ""}`}>{adult.canPickup ? "Puede recoger" : "Sin permiso de recogida"}</span></div>)}</div> : <p className="profile-unspecified">No hay adultos configurados para la recogida.</p>}
    </section>
    <section className="profile-detail-section" ref={careSection} tabIndex={-1} aria-label="Cuidados especiales">
      <SpecialCareDetails plan={child.specialCare} onEdit={onEditCare} />
    </section>
    <section className="profile-detail-section">
      <h3><Heart size={18} aria-hidden="true" />Salud y cuidados</h3>
      <dl className="profile-details-grid">
        <Detail label="Tipo de sangre">{health.bloodType}</Detail>
        <Detail label="Alergias">{health.allergies.map(allergy => allergy.name).join(", ")}</Detail>
        <Detail label="Condiciones médicas">{health.conditions}</Detail>
        <Detail label="Severidad">{health.conditionSeverity ? { mild: "Leve", moderate: "Moderada", severe: "Severa" }[health.conditionSeverity] : undefined}</Detail>
        <Detail label="Medicamentos">{health.medications.length ? health.medications.map(medication => <span key={medication.id} className="profile-detail-line">{[medication.name, medication.dose, medication.frequency].filter(Boolean).join(" · ")}</span>) : undefined}</Detail>
        <Detail label="Médico">{health.doctorName}</Detail>
        <Detail label="Teléfono del médico">{health.doctorPhone}</Detail>
      </dl>
    </section>
  </div>;
}
