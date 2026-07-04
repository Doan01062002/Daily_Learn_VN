import { promises as fs } from "fs";
import path from "path";

export async function hasPermission(role: string, permission: string): Promise<boolean> {
  // ADMIN (Super Admin) always has all permissions
  if (role === "ADMIN") return true;
  
  // Standard roles have no administrative permissions
  if (role !== "CTV" && role !== "OPERATOR") return false;

  try {
    const filePath = path.join(process.cwd(), "src", "data", "settings.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(fileData);
    
    const permissions = parsed.rolePermissions?.[role] || [];
    return permissions.includes(permission);
  } catch (e) {
    // Fallback default permissions in case of read error
    if (role === "CTV") {
      return ["manage_lessons", "manage_quizzes"].includes(permission);
    }
    if (role === "OPERATOR") {
      return ["manage_users", "manage_payments", "manage_notifications"].includes(permission);
    }
    return false;
  }
}
