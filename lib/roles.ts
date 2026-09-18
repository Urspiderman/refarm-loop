export type Role =
  | "supplier_farmer"
  | "supplier_market"
  | "recovery_partner"
  | "collector"
  | "admin";

export function roleHome(role: Role) {
  switch (role) {
    case "admin":
      return "/admin/overview";

    case "recovery_partner":
      return "/partners";

    case "collector":
      return "/collector/dashboard";

    case "supplier_farmer":
    case "supplier_market":
    default:
      return "/home";
  }
}