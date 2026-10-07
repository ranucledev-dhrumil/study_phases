const ROLE_PERMISSIONS = {
  reporter: ["read:any", "create:any", "update:own", "delete:own"],
  maintainer: ["read:any", "create:any", "update:any", "delete:any"],
  admin: ["read:any", "create:any", "update:any", "delete:any", "manage:roles"],
};

export default ROLE_PERMISSIONS;