import Parse from "parse";

import type { _User } from "./_User";

export interface _SessionAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  createdWith?: any;
  expiresAt?: Date;
  installationId?: string;
  sessionToken?: string;
  user?: _User;
}

export type _Session = Parse.Session<_SessionAttributes>;
