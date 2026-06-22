import { getInitials, getAvatarColor } from "../../../utils/child";
import type { Child } from "../../../types/child";
import "./ChildAvatar.css";

type AvatarSize = "sm" | "md" | "lg";

interface ChildAvatarProps {
  child: Pick<Child, "name" | "lastName" | "photoUrl">;
  size?: AvatarSize;
}

export function ChildAvatar({ child, size = "md" }: ChildAvatarProps) {
  const { name, lastName, photoUrl } = child;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${name} ${lastName}`}
        className={`child-avatar child-avatar-${size}`}
        onError={(e) => {
          // Si la imagen falla, la reemplaza con un div de iniciales
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const div = document.createElement("div");
            div.className = `child-avatar child-avatar-${size} child-avatar-initials`;
            div.style.background = getAvatarColor(name, lastName);
            div.textContent = getInitials(name, lastName);
            parent.replaceChild(div, e.currentTarget);
          }
        }}
      />
    );
  }

  return (
    <div
      className={`child-avatar child-avatar-${size} child-avatar-initials`}
      style={{ background: getAvatarColor(name, lastName) }}
    >
      {getInitials(name, lastName)}
    </div>
  );
}