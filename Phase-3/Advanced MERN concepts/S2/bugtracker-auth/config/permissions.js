const ROLE_PERMISSIONS = {
    reporter: ["read:any", "create:any",],

    maintainer: ["read:any", "create:any", "update:any",],

    admin: ["read:any", "create:any", "update:any", "delete:any",],
};

export default ROLE_PERMISSIONS;