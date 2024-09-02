import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface _UserAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  authData?: any;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  password?: string;
  tenant?: OD3_Tenant;
  tenantAdmin?: boolean;
  tenantBanned?: boolean;
  tenantChanged?: boolean;
  tenantGlobal?: boolean;
  tenantVerified?: boolean;
  username?: string;
}

export type _User = Parse.User<_UserAttributes>;
