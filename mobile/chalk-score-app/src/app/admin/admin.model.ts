export interface PendingUser {
  id: string;
  auth0Id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  auth0Id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string | null;
  updatedByName: string | null;
}
