export type LegalResourceCategory = "official" | "legal_aid" | "professional"

export type LegalResourceSourceType =
  | "statutory_portal"
  | "court_portal"
  | "legal_aid_authority"
  | "regulatory_body"
  | "professional_guidance"

export interface LegalResource {
  id: string
  title: string
  description: string
  category: LegalResourceCategory
  jurisdiction: string
  organization: string
  url: string
  sourceType: LegalResourceSourceType
  lastVerified: string
  relevanceHint?: string
}

export interface ResourceResolutionResult {
  isSupported: boolean
  jurisdiction: string
  resources: LegalResource[]
  limitationMessage?: string
}

/**
 * Centralized registry of verified authoritative legal resources.
 * All URLs are verified against official government (.gov.in / .nic.in) domains.
 * Do not inject user or document text into this registry.
 */
export const LEGAL_RESOURCES: readonly LegalResource[] = Object.freeze([
  {
    id: "res_india_code",
    title: "India Code Digital Legislative Repository",
    description: "Official digital repository of all Central Enactments, State Acts, and subordinate rules and regulations in their current updated form.",
    category: "official",
    jurisdiction: "India",
    organization: "Legislative Department, Ministry of Law and Justice, Government of India",
    url: "https://www.indiacode.nic.in",
    sourceType: "statutory_portal",
    lastVerified: "September 2026",
    relevanceHint: "Search and verify applicable Central Acts, State amendments, and statutory rules referenced in agreements.",
  },
  {
    id: "res_nalsa",
    title: "National Legal Services Authority (NALSA)",
    description: "Official statutory authority providing free legal services, counsel access, and Lok Adalat dispute resolution for eligible citizens under the Legal Services Authorities Act, 1987.",
    category: "legal_aid",
    jurisdiction: "India",
    organization: "National Legal Services Authority (Statutory Body under Supreme Court of India)",
    url: "https://nalsa.gov.in",
    sourceType: "legal_aid_authority",
    lastVerified: "September 2026",
    relevanceHint: "Access free legal assistance, panel advocates, and alternative dispute resolution through State and District Legal Services Authorities.",
  },
  {
    id: "res_ecourts",
    title: "eCourts Services Unified Judicial Portal",
    description: "Official national portal for tracking case status, daily court orders, cause lists, and filings across District Courts and High Courts in India.",
    category: "official",
    jurisdiction: "India",
    organization: "eCommittee, Supreme Court of India & Department of Justice, GoI",
    url: "https://services.ecourts.gov.in",
    sourceType: "court_portal",
    lastVerified: "September 2026",
    relevanceHint: "Review court orders, check case listings, and verify filings under local judicial jurisdictions.",
  },
  {
    id: "res_sci",
    title: "Supreme Court of India Official Portal",
    description: "Apex judicial decisions, reported judgments, daily orders, cause lists, and procedural rules of the Supreme Court of India.",
    category: "official",
    jurisdiction: "India",
    organization: "Supreme Court of India",
    url: "https://www.sci.gov.in",
    sourceType: "court_portal",
    lastVerified: "September 2026",
    relevanceHint: "Inspect apex court precedents and binding judicial interpretations.",
  },
  {
    id: "res_lawmin",
    title: "Ministry of Law and Justice (GoI)",
    description: "Official portal of the Ministry of Law and Justice overseeing legislative drafting, legal affairs, and justice administration across India.",
    category: "official",
    jurisdiction: "India",
    organization: "Ministry of Law and Justice, Government of India",
    url: "https://lawmin.gov.in",
    sourceType: "regulatory_body",
    lastVerified: "September 2026",
    relevanceHint: "Review judicial administrative policies, legal treaties, and central department notifications.",
  },
  {
    id: "res_edaakhil",
    title: "e-Daakhil Consumer Grievance & Dispute Portal",
    description: "Official digital portal under the Consumer Protection Act, 2019 for filing and tracking consumer disputes before District, State, and National Consumer Commissions.",
    category: "official",
    jurisdiction: "India",
    organization: "Department of Consumer Affairs, Government of India",
    url: "https://edaakhil.nic.in",
    sourceType: "regulatory_body",
    lastVerified: "September 2026",
    relevanceHint: "File and track consumer dispute redressal complaints online without physical court visits.",
  },
])

/**
 * Deterministically resolves verified resources for a given jurisdiction.
 * If the jurisdiction is not India, returns an honest limitation result.
 */
export function resolveResourcesForJurisdiction(
  jurisdiction: string,
  context?: {
    hasConsumerClauses?: boolean
    hasLitigation?: boolean
  }
): ResourceResolutionResult {
  const norm = (jurisdiction || "").trim().toLowerCase()

  if (norm !== "india" && !norm.includes("delhi") && !norm.includes("bengaluru") && !norm.includes("mumbai")) {
    return {
      isSupported: false,
      jurisdiction: jurisdiction || "Unknown",
      resources: [],
      limitationMessage: `LawLens currently provides verified legal resource navigation exclusively for India. Authoritative directory navigation for "${jurisdiction || "this jurisdiction"}" is not yet available.`,
    }
  }

  // Filter and order India resources based on document context if provided
  let filtered = [...LEGAL_RESOURCES]

  if (context?.hasConsumerClauses) {
    // Elevate e-Daakhil and NALSA
    filtered = [
      filtered.find((r) => r.id === "res_edaakhil")!,
      filtered.find((r) => r.id === "res_nalsa")!,
      ...filtered.filter((r) => r.id !== "res_edaakhil" && r.id !== "res_nalsa"),
    ]
  }

  return {
    isSupported: true,
    jurisdiction: "India",
    resources: filtered,
  }
}
