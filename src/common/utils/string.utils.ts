export function normalizaEmail(email: string): string {
  return email.toLowerCase().trim();
}
export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // remove anything that isn't a letter, number, or hyphen
    .replace(/-+/g, '-') // collapse multiple hyphens into one
    .replace(/^-|-$/g, ''); // strip leading/trailing hyphens
}
