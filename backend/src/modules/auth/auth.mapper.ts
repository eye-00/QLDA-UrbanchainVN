import type { User } from "@prisma/client";

export interface PublicUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  organizationId: string | null;
}

export function toPublicUser(
  user: Pick<User, "id" | "fullName" | "email" | "role" | "status" | "organizationId">
): PublicUser {
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    organizationId: user.organizationId
  };
}
