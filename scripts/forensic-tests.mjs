/**
 * LawLens Forensic Tests A-D
 * ============================
 * Controlled experiment to confirm/deny the root cause of the production HTTP 400.
 *
 * HYPOTHESIS: Groq returns HTTP 400 when `reasoning_effort` is sent alongside
 * `response_format: { type: "json_schema", json_schema: { strict: true } }`
 * on GPT-OSS models.
 *
 * INDEPENDENT VARIABLE: presence/absence of `reasoning_effort`
 * CONTROLLED VARIABLES: model, schema, temperature, document content
 *
 * Test A: json_schema strict + reasoning_effort=low  → EXPECT 400
 * Test B: json_schema strict + NO reasoning_effort   → EXPECT 200
 * Test C: json_object + reasoning_effort=low          → EXPECT 200 (confirms effort alone is OK)
 * Test D: json_schema strict + include_reasoning=true → EXPECT 200 (include_reasoning is different)
 */

import fs from "fs"

const API_KEY = process.env.GROQ_API_KEY
const API_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODEL = "openai/gpt-oss-120b"

if (!API_KEY) {
  console.error("[FATAL] GROQ_API_KEY not set in environment")
  process.exit(1)
}

// Minimal strict schema for testing
const MINI_SCHEMA = {
  type: "object",
  properties: {
    result: { type: "string" },
  },
  required: ["result"],
  additionalProperties: false,
}

const SYSTEM = "You are a legal document assistant. Respond only with valid JSON."
const USER = 'Summarize this one-sentence document: "This is a test contract between Party A and Party B." Return { "result": "..." }'

async function runTest(label, payload) {
  const startMs = Date.now()
  console.log(`\n${"=".repeat(60)}`)
  console.log(`[TEST ${label}] STARTING`)
  console.log(`[TEST ${label}] Payload:`, JSON.stringify(payload, null, 2))

  let status = "unknown"
  let body = null
  let errorText = ""

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    status = res.status
    const latencyMs = Date.now() - startMs

    try {
      body = await res.json()
    } catch {
      body = { raw: await res.text() }
    }

    if (status === 200) {
      const content = body?.choices?.[0]?.message?.content
      console.log(`[TEST ${label}] RESULT: HTTP 200 OK (${latencyMs}ms)`)
      console.log(`[TEST ${label}] Content: ${content?.slice(0, 200)}`)
      if (body?.usage) {
        console.log(`[TEST ${label}] Tokens: in=${body.usage.prompt_tokens} out=${body.usage.completion_tokens}`)
      }
    } else {
      const errMsg = body?.error?.message || JSON.stringify(body)
      errorText = errMsg
      console.log(`[TEST ${label}] RESULT: HTTP ${status} ERROR (${latencyMs}ms)`)
      console.log(`[TEST ${label}] Error message: ${errMsg}`)
    }

    return { label, status, latencyMs, error: errorText, success: status === 200 }
  } catch (err) {
    const latencyMs = Date.now() - startMs
    console.log(`[TEST ${label}] NETWORK ERROR: ${err.message} (${latencyMs}ms)`)
    return { label, status: "network_error", latencyMs, error: err.message, success: false }
  }
}

async function main() {
  console.log("LawLens Forensic Tests — Groq API Root Cause Analysis")
  console.log("Model:", MODEL)
  console.log("API URL:", API_URL)
  console.log("")

  const results = []

  // ------------------------------------------------------------------
  // TEST A: json_schema strict + reasoning_effort=low → EXPECT 400
  // This is the failing production configuration.
  // ------------------------------------------------------------------
  results.push(await runTest("A", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "test_schema",
        strict: true,
        schema: MINI_SCHEMA,
      },
    },
    reasoning_effort: "low",
    temperature: 0.1,
  }))

  // Wait between tests to avoid rate limiting
  await new Promise(r => setTimeout(r, 2000))

  // ------------------------------------------------------------------
  // TEST B: json_schema strict + NO reasoning_effort → EXPECT 200
  // This is the fixed production configuration.
  // ------------------------------------------------------------------
  results.push(await runTest("B", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "test_schema",
        strict: true,
        schema: MINI_SCHEMA,
      },
    },
    temperature: 0.1,
  }))

  await new Promise(r => setTimeout(r, 2000))

  // ------------------------------------------------------------------
  // TEST C: json_object mode + reasoning_effort=low → EXPECT 200
  // Proves reasoning_effort alone is valid; the conflict is the combo.
  // ------------------------------------------------------------------
  results.push(await runTest("C", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER + " Respond in JSON." },
    ],
    response_format: {
      type: "json_object",
    },
    reasoning_effort: "low",
    temperature: 0.1,
  }))

  await new Promise(r => setTimeout(r, 2000))

  // ------------------------------------------------------------------
  // TEST D: json_schema strict + include_reasoning=true → EXPECT 200
  // Proves include_reasoning (different param) is not the culprit.
  // ------------------------------------------------------------------
  results.push(await runTest("D", {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "test_schema",
        strict: true,
        schema: MINI_SCHEMA,
      },
    },
    include_reasoning: true,
    temperature: 0.1,
  }))

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  console.log("\n" + "=".repeat(60))
  console.log("FORENSIC TEST RESULTS SUMMARY")
  console.log("=".repeat(60))
  for (const r of results) {
    const verdict = r.success ? "✅ PASS" : `❌ FAIL (HTTP ${r.status})`
    console.log(`Test ${r.label}: ${verdict} — ${r.latencyMs}ms`)
    if (!r.success) {
      console.log(`  Error: ${r.error?.slice(0, 200)}`)
    }
  }

  // Interpretation
  const testA = results.find(r => r.label === "A")
  const testB = results.find(r => r.label === "B")
  const testC = results.find(r => r.label === "C")
  const testD = results.find(r => r.label === "D")

  console.log("\n=== INTERPRETATION ===")
  if (testA && !testA.success && testB?.success) {
    console.log("✅ HYPOTHESIS CONFIRMED: reasoning_effort + json_schema strict IS the root cause.")
    console.log("   Evidence: Test A (with reasoning_effort) fails, Test B (without) succeeds.")
  } else if (testA?.success) {
    console.log("⚠️  HYPOTHESIS REFUTED: Test A succeeded — reasoning_effort may NOT be the cause.")
  } else if (!testB?.success) {
    console.log("⚠️  HYPOTHESIS REFUTED: Test B also fails — the problem is not reasoning_effort alone.")
  }

  if (testC?.success) {
    console.log("✅ reasoning_effort alone (with json_object) is valid — confirms it's the COMBINATION that causes 400.")
  }
  if (testD?.success) {
    console.log("✅ include_reasoning (different param) with json_schema strict is valid.")
  }

  // Save results
  const outPath = "./scripts/forensic-results.json"
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nResults saved to: ${outPath}`)
}

main().catch(err => {
  console.error("[FATAL]", err)
  process.exit(1)
})
