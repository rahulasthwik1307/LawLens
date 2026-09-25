/**
 * LawLens Forensic Tests — Extended Battery
 * ============================================
 * Test A previously passed with reasoning_effort + strict json_schema.
 * We now need to test with the FULL production schema (not the mini one)
 * and with actual LawLens prompt sizes to replicate production conditions.
 *
 * Hypotheses to test:
 * E: Full ANALYSIS schema + reasoning_effort=low → does the full schema trigger 400?
 * F: Full ANALYSIS schema + reasoning_effort=low + large user prompt (~2656 tokens input)
 * G: Can we replicate the exact production 400 at all?
 * H: Was the error perhaps from a *previous* Groq API version that no longer applies?
 */

import fs from "fs"
import path from "path"

const API_KEY = process.env.GROQ_API_KEY
const API_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODEL = "openai/gpt-oss-120b"

if (!API_KEY) {
  console.error("[FATAL] GROQ_API_KEY not set")
  process.exit(1)
}

// Full production schema (from groq-schemas.ts)
const FINDING_ITEM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    explanation: { type: "string" },
    confidence: {
      type: "string",
      enum: ["clear_in_document", "supported_by_source", "needs_review", "unclear_from_document"],
    },
    uncertainty: { type: ["string", "null"] },
    evidenceQuote: { type: ["string", "null"] },
    startLine: { type: ["number", "null"] },
    endLine: { type: ["number", "null"] },
  },
  required: ["title", "explanation", "confidence", "uncertainty", "evidenceQuote", "startLine", "endLine"],
  additionalProperties: false,
}

const FULL_ANALYSIS_SCHEMA = {
  name: "legal_document_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      documentType: { type: "string" },
      summary: { type: "string" },
      parties: { type: "array", items: FINDING_ITEM_SCHEMA },
      dates: { type: "array", items: FINDING_ITEM_SCHEMA },
      monetaryItems: { type: "array", items: FINDING_ITEM_SCHEMA },
      rights: { type: "array", items: FINDING_ITEM_SCHEMA },
      obligations: { type: "array", items: FINDING_ITEM_SCHEMA },
      restrictions: { type: "array", items: FINDING_ITEM_SCHEMA },
      termination: { type: "array", items: FINDING_ITEM_SCHEMA },
      disputeResolution: { type: "array", items: FINDING_ITEM_SCHEMA },
      reviewPoints: { type: "array", items: FINDING_ITEM_SCHEMA },
    },
    required: [
      "documentType", "summary", "parties", "dates", "monetaryItems",
      "rights", "obligations", "restrictions", "termination", "disputeResolution", "reviewPoints"
    ],
    additionalProperties: false,
  },
}

// The exact static system instruction that would have been used in production
const SYSTEM_INSTRUCTION = `You are LawLens, a legal document analysis assistant.

Analyze the provided legal document and return structured JSON conforming exactly to the requested schema.

EVIDENCE REQUIREMENTS (non-negotiable):
- Every finding must include at minimum one evidenceQuote — a verbatim excerpt from the document
- Every evidenceQuote must have corresponding startLine and endLine numbers from the annotated document
- Do not fabricate quotes or line numbers — only use text that exists in the document
- If you cannot find evidence for a category, return an empty array

CONFIDENCE LEVELS:
- clear_in_document: The information is explicitly and unambiguously stated
- supported_by_source: The information is strongly implied or logically follows from the text
- needs_review: The information is present but ambiguous or incomplete
- unclear_from_document: The information cannot be reliably determined from the document

DOCUMENT FORMAT:
- Lines are annotated with [Lnn] markers showing line numbers
- Use these line numbers for startLine/endLine in your evidence citations
- Quotes must be verbatim excerpts from the annotated text

Return only valid JSON conforming to the schema. Do not add commentary outside the JSON.`

// Simulate a ~2600-token user prompt with 105 lines / 835 words of document content
const simulateDocumentPrompt = () => {
  // Approximate 105 lines of a realistic service agreement
  const lines = []
  lines.push("[L001] SERVICE AGREEMENT")
  lines.push("[L002] ")
  lines.push("[L003] This Service Agreement (\"Agreement\") is entered into as of December 9, 2023,")
  lines.push("[L004] between Acme Corporation, a Delaware corporation (\"Service Provider\"), and")
  lines.push("[L005] Beta Enterprises Inc., a California corporation (\"Client\").")
  lines.push("[L006] ")
  lines.push("[L007] 1. SERVICES")
  lines.push("[L008] ")
  lines.push("[L009] Service Provider agrees to provide software development and consulting")
  lines.push("[L010] services as described in Exhibit A attached hereto (the \"Services\").")
  lines.push("[L011] ")
  lines.push("[L012] 2. TERM")
  lines.push("[L013] ")
  lines.push("[L014] This Agreement shall commence on January 1, 2024 and continue for a period")
  lines.push("[L015] of twelve (12) months unless earlier terminated in accordance with Section 8.")
  lines.push("[L016] The Agreement may be renewed by mutual written consent of the parties.")
  lines.push("[L017] ")
  lines.push("[L018] 3. FEES AND PAYMENT")
  lines.push("[L019] ")
  lines.push("[L020] Client shall pay Service Provider a monthly fee of $15,000 USD due within")
  lines.push("[L021] thirty (30) days of invoice. Late payments shall accrue interest at 1.5%")
  lines.push("[L022] per month. In addition, Client shall reimburse reasonable expenses incurred")
  lines.push("[L023] by Service Provider in performing the Services, provided such expenses are")
  lines.push("[L024] pre-approved in writing and documented with receipts.")
  lines.push("[L025] ")
  lines.push("[L026] 4. INTELLECTUAL PROPERTY")
  lines.push("[L027] ")
  lines.push("[L028] All work product, deliverables, and intellectual property created by Service")
  lines.push("[L029] Provider in connection with the Services shall be considered work made for")
  lines.push("[L030] hire and shall be owned exclusively by Client upon full payment of all fees.")
  lines.push("[L031] Service Provider retains a non-exclusive license to use generalized knowledge,")
  lines.push("[L032] skills, and methodologies developed during the engagement.")
  lines.push("[L033] ")
  lines.push("[L034] 5. CONFIDENTIALITY")
  lines.push("[L035] ")
  lines.push("[L036] Each party (the \"Receiving Party\") agrees to hold in strict confidence all")
  lines.push("[L037] confidential information of the other party (the \"Disclosing Party\") and shall")
  lines.push("[L038] not disclose such information to any third party without prior written consent.")
  lines.push("[L039] This obligation shall survive termination of this Agreement for a period of")
  lines.push("[L040] five (5) years.")
  lines.push("[L041] ")
  lines.push("[L042] 6. REPRESENTATIONS AND WARRANTIES")
  lines.push("[L043] ")
  lines.push("[L044] Service Provider represents and warrants that: (a) it has full authority to")
  lines.push("[L045] enter into this Agreement; (b) the Services will be performed in a professional")
  lines.push("[L046] manner consistent with industry standards; (c) the deliverables will not infringe")
  lines.push("[L047] upon any third-party intellectual property rights.")
  lines.push("[L048] ")
  lines.push("[L049] 7. LIMITATION OF LIABILITY")
  lines.push("[L050] ")
  lines.push("[L051] IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL,")
  lines.push("[L052] SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS")
  lines.push("[L053] AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. SERVICE")
  lines.push("[L054] PROVIDER'S TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID IN THE THREE")
  lines.push("[L055] (3) MONTHS PRECEDING THE CLAIM.")
  lines.push("[L056] ")
  lines.push("[L057] 8. TERMINATION")
  lines.push("[L058] ")
  lines.push("[L059] Either party may terminate this Agreement with thirty (30) days written notice.")
  lines.push("[L060] Client may terminate immediately for cause if Service Provider materially")
  lines.push("[L061] breaches this Agreement and fails to cure such breach within fifteen (15)")
  lines.push("[L062] days of written notice. Service Provider may terminate immediately if Client")
  lines.push("[L063] fails to make payment when due after a ten (10) day cure period.")
  lines.push("[L064] ")
  lines.push("[L065] 9. DISPUTE RESOLUTION")
  lines.push("[L066] ")
  lines.push("[L067] Any dispute arising under this Agreement shall first be subject to good-faith")
  lines.push("[L068] negotiation between senior representatives of the parties for a period of")
  lines.push("[L069] thirty (30) days. If unresolved, disputes shall be submitted to binding")
  lines.push("[L070] arbitration in accordance with the rules of the American Arbitration Association")
  lines.push("[L071] in New York, New York. The arbitrator's decision shall be final and binding.")
  lines.push("[L072] ")
  lines.push("[L073] 10. GOVERNING LAW")
  lines.push("[L074] ")
  lines.push("[L075] This Agreement shall be governed by the laws of the State of New York,")
  lines.push("[L076] without regard to its conflict of laws provisions.")
  lines.push("[L077] ")
  lines.push("[L078] 11. INDEPENDENT CONTRACTOR")
  lines.push("[L079] ")
  lines.push("[L080] Service Provider is an independent contractor and not an employee of Client.")
  lines.push("[L081] Service Provider shall be responsible for all taxes, insurance, and other")
  lines.push("[L082] obligations associated with its status as an independent contractor.")
  lines.push("[L083] ")
  lines.push("[L084] 12. NON-SOLICITATION")
  lines.push("[L085] ")
  lines.push("[L086] During the term of this Agreement and for a period of twelve (12) months")
  lines.push("[L087] thereafter, Client shall not directly solicit or hire any employee or")
  lines.push("[L088] contractor of Service Provider who was involved in the Services without")
  lines.push("[L089] prior written consent of Service Provider.")
  lines.push("[L090] ")
  lines.push("[L091] 13. AMENDMENTS")
  lines.push("[L092] ")
  lines.push("[L093] This Agreement may only be amended by a written instrument signed by both")
  lines.push("[L094] parties. No waiver of any provision shall be effective unless in writing.")
  lines.push("[L095] ")
  lines.push("[L096] 14. ENTIRE AGREEMENT")
  lines.push("[L097] ")
  lines.push("[L098] This Agreement, together with Exhibit A, constitutes the entire agreement")
  lines.push("[L099] between the parties and supersedes all prior negotiations, representations,")
  lines.push("[L100] or agreements relating to the subject matter hereof.")
  lines.push("[L101] ")
  lines.push("[L102] IN WITNESS WHEREOF, the parties have executed this Agreement as of the date")
  lines.push("[L103] first written above.")
  lines.push("[L104] ")
  lines.push("[L105] ACME CORPORATION                    BETA ENTERPRISES INC.")

  const docText = lines.join("\n")

  return `Analyze the following legal document. Return structured analysis as JSON.

<document>
${docText}
</document>

Identify all parties, dates, monetary items, rights, obligations, restrictions, termination provisions, dispute resolution mechanisms, and key review points. For each item, provide a verbatim evidenceQuote and the corresponding startLine/endLine from the [Lnnn] markers.`
}

async function runTest(label, payload, description) {
  const startMs = Date.now()
  const schemaTokenApprox = JSON.stringify(payload.response_format || {}).length / 4
  const userTokenApprox = (payload.messages.find(m => m.role === "user")?.content?.length || 0) / 4
  const systemTokenApprox = (payload.messages.find(m => m.role === "system")?.content?.length || 0) / 4
  const totalApprox = Math.round(schemaTokenApprox + userTokenApprox + systemTokenApprox)

  console.log(`\n${"=".repeat(70)}`)
  console.log(`[TEST ${label}] ${description}`)
  console.log(`[TEST ${label}] Approx input tokens: ~${totalApprox}`)
  console.log(`[TEST ${label}] reasoning_effort: ${payload.reasoning_effort ?? "OMITTED"}`)
  console.log(`[TEST ${label}] response_format type: ${payload.response_format?.type}`)

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const status = res.status
    const latencyMs = Date.now() - startMs
    let body = null
    try {
      body = await res.json()
    } catch {
      body = null
    }

    if (status === 200) {
      const content = body?.choices?.[0]?.message?.content
      console.log(`[TEST ${label}] ✅ HTTP 200 (${latencyMs}ms) | actual tokens: in=${body?.usage?.prompt_tokens} out=${body?.usage?.completion_tokens}`)
      if (content) {
        try {
          const parsed = JSON.parse(content)
          console.log(`[TEST ${label}] JSON valid: documentType="${parsed.documentType}" parties=${parsed.parties?.length}`)
        } catch {
          console.log(`[TEST ${label}] ⚠️ Content not valid JSON: ${content.slice(0, 100)}`)
        }
      }
      return { label, status: 200, success: true, latencyMs }
    } else {
      const errMsg = body?.error?.message || JSON.stringify(body)
      console.log(`[TEST ${label}] ❌ HTTP ${status} (${latencyMs}ms)`)
      console.log(`[TEST ${label}] Error: ${errMsg}`)
      return { label, status, success: false, latencyMs, error: errMsg }
    }
  } catch (err) {
    console.log(`[TEST ${label}] ❌ NETWORK ERROR: ${err.message}`)
    return { label, status: "network_error", success: false, latencyMs: Date.now() - startMs, error: err.message }
  }
}

async function main() {
  console.log("LawLens Forensic Extended Tests — Full Schema + Production Payload")
  console.log(`Model: ${MODEL}`)

  const results = []

  // TEST E: Full analysis schema without max_completion_tokens (reproduces production truncation)
  results.push(await runTest("E", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: simulateDocumentPrompt() },
    ],
    response_format: {
      type: "json_schema",
      json_schema: FULL_ANALYSIS_SCHEMA,
    },
    temperature: 0.1,
  }, "FULL schema + NO max_completion_tokens (reproduces truncation 400)"))

  await new Promise(r => setTimeout(r, 3000))

  // TEST F: Full analysis schema with max_completion_tokens: 8000 (production fix)
  results.push(await runTest("F", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: simulateDocumentPrompt() },
    ],
    response_format: {
      type: "json_schema",
      json_schema: FULL_ANALYSIS_SCHEMA,
    },
    max_completion_tokens: 8000,
    temperature: 0.1,
  }, "FULL schema + max_completion_tokens: 8000 (the fix)"))

  console.log("\n" + "=".repeat(70))
  console.log("EXTENDED FORENSIC RESULTS")
  console.log("=".repeat(70))
  for (const r of results) {
    console.log(`Test ${r.label}: ${r.success ? "✅ PASS" : `❌ FAIL (HTTP ${r.status})`} — ${r.latencyMs}ms`)
    if (!r.success) console.log(`  Error: ${r.error?.slice(0, 300)}`)
  }

  const testE = results.find(r => r.label === "E")
  const testF = results.find(r => r.label === "F")

  console.log("\n=== FORENSIC CONCLUSION ===")
  if (!testE?.success && testF?.success) {
    console.log("✅ CONFIRMED ROOT CAUSE & FIX:")
    console.log("   Without max_completion_tokens (or too small), output truncates causing Groq HTTP 400.")
    console.log("   With max_completion_tokens: 8000, the analysis completes with HTTP 200 and valid JSON!")
  } else if (testF?.success) {
    console.log("✅ FIX VERIFIED: max_completion_tokens: 8000 successfully returns HTTP 200.")
  } else {
    console.log("❌ Fix needs further investigation.")
  }

  fs.writeFileSync("./scripts/forensic-extended-results.json", JSON.stringify(results, null, 2))
  console.log("\nResults saved to: scripts/forensic-extended-results.json")
}

main().catch(err => {
  console.error("[FATAL]", err)
  process.exit(1)
})
