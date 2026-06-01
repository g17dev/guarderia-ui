export interface Child {
  id: string;
  name: string;
  lastName: string;
  birthDate: string;
  classroom: string;
  photoUrl?: string;
  tutor: Tutor;
  allergies: string[];
  enrollmentDate: string;
  status: "active" | "inactive";
  attendances?: Attendance[];
}
export interface Tutor {
  name: string;
  lastName: string;
  phone: string;
  relationship: string;
}

export interface Attendance {
  date: string;
  entryTime?: string;
  exitTime?: string;
}
