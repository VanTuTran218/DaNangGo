/** Che bớt email: tu***@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = Math.min(2, local.length);
  return `${local.slice(0, visible)}${'*'.repeat(Math.max(3, local.length - visible))}@${domain}`;
}
