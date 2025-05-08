import Parse from "parse";

import type { _User } from "./_User";

export interface _RoleAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  label?: string;
  name?: string;
  roles: Parse.Relation<_Role, _Role>;
  users: Parse.Relation<_Role, _User>;
}

export type _Role = Parse.Role<_RoleAttributes>;
