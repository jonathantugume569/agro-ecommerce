export const ROLES = {
  FARMER: "farmer",
  DEALER: "dealer",
  ADMIN: "admin",
};

// Where each role lands after logging in.
export function homePathForRole(role) {
  switch (role) {
    case ROLES.DEALER:
      return "/dealer/dashboard";
    case ROLES.ADMIN:
      return "/admin/dashboard";
    case ROLES.FARMER:
    default:
      return "/products";
  }
}
