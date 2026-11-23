import { useState } from "react";
import { getInitials } from "../../../utils/child";
import type { Child } from "../../../types/child";
import "./ChildAvatar.css";

type AvatarSize = "sm" | "md" | "lg";

interface ChildAvatarProps {
  child: Pick<Child, "name" | "lastName" | "photoUrl">;
  size?: AvatarSize;
}

export function ChildAvatar({ child, size = "md" }: ChildAvatarProps) {
  const { name, lastName, photoUrl } = child;
  const [failedPhoto, setFailedPhoto] = useState<string>();

  if (photoUrl && photoUrl !== failedPhoto) {
    return (
      <img
        src={photoUrl}
        alt={`${name} ${lastName}`}
        className={`child-avatar child-avatar-${size}`}
        onError={() => setFailedPhoto(photoUrl)}
      />
    );
  }

  return (
    <div
      className={`child-avatar child-avatar-${size} child-avatar-initials`}
    >
      {getInitials(name, lastName)}
    </div>
  );
}
