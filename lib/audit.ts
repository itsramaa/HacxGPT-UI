export async function reportAuditLog(
  level: "INFO" | "WARN" | "ERROR" | "SECURITY",
  module: string,
  message: string
) {
  try {
    await fetch("/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, module, message }),
    });
  } catch (e) {
    console.warn("Audit reporting failure:", e);
  }
}
