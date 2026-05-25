export function generateId(prefix: string, sequence: number): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(sequence).padStart(3, "0")}`
}

export function parseId(id: string): { prefix: string; year: number; sequence: number } | null {
  const parts = id.split("-")
  if (parts.length !== 3) return null
  const [prefix, yearStr, seqStr] = parts
  const year = parseInt(yearStr, 10)
  const sequence = parseInt(seqStr, 10)
  if (isNaN(year) || isNaN(sequence)) return null
  return { prefix, year, sequence }
}

export const ID_PREFIXES = {
  order: "ORD",
  cantiere: "CANT",
  quote: "QUO",
  supplier: "SUP",
  client: "CLI",
  payment: "PAY",
  delivery: "DEL",
  certificate: "CERT",
  document: "DOC",
  task: "TSK",
  appointment: "APT",
  collaborator: "COL",
} as const
