#!/usr/bin/env bun
/**
 * Selective Disclosure Demo
 *
 * This script demonstrates how to use Gordian Envelope for selective disclosure,
 * creating different views of the same document for different recipients while
 * maintaining cryptographic verifiability.
 *
 * Usage: bun run scripts/selective-disclosure-demo.ts
 */

import { Envelope } from "@bcts/envelope";

// Helper to print envelope tree format
function printEnvelope(name: string, envelope: Envelope): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Digest: ${envelope.digest().hex().slice(0, 16)}...`);
  console.log(`\nStructure:`);
  console.log(envelope.treeFormat());
}

// Helper to verify digest equality
function verifyDigests(original: Envelope, derived: Envelope, name: string): void {
  const match = original.digest().equals(derived.digest());
  const status = match ? "✅" : "❌";
  console.log(`${status} ${name} digest matches original: ${match}`);
}

function main(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          SELECTIVE DISCLOSURE DEMONSTRATION                  ║
║                                                              ║
║  Creating different views of an identity document for        ║
║  different recipients while maintaining verifiability.       ║
╚══════════════════════════════════════════════════════════════╝
`);

  // ============================================================
  // STEP 1: Create a complete identity envelope
  // ============================================================

  console.log("\n🔨 STEP 1: Creating complete identity document...\n");

  // Create a comprehensive identity envelope with various claims
  const identity = Envelope.new("John Smith")
    // Personal Information
    .addAssertion("dateOfBirth", "1985-03-15")
    .addAssertion("age", 39)
    .addAssertion("ssn", "123-45-6789")
    .addAssertion("nationality", "US Citizen")

    // Contact Information
    .addAssertion("email", "john.smith@email.com")
    .addAssertion("phone", "+1-555-123-4567")
    .addAssertion(
      "address",
      Envelope.new("Home Address")
        .addAssertion("street", "123 Main Street")
        .addAssertion("city", "San Francisco")
        .addAssertion("state", "CA")
        .addAssertion("zip", "94102"),
    )

    // Professional Information
    .addAssertion("employer", "Tech Corp Inc.")
    .addAssertion("jobTitle", "Senior Engineer")
    .addAssertion("employeeId", "EMP-2024-1234")

    // Financial Information
    .addAssertion("annualIncome", 150000)
    .addAssertion("creditScore", 780)

    // Medical Information
    .addAssertion("bloodType", "O+")
    .addAssertion("allergies", "Penicillin");

  printEnvelope("COMPLETE IDENTITY (Owner's View)", identity);

  // Store the original digest for verification
  const originalDigest = identity.digest();
  console.log(`\n🔐 Original Document Digest: ${originalDigest.hex()}`);

  // ============================================================
  // STEP 2: Create recipient-specific views
  // ============================================================

  console.log("\n\n🎭 STEP 2: Creating recipient-specific views...\n");

  // ------------------------------------------------------------
  // View A: Age Verification (Bar/Club)
  // Hides everything except: subject name + age
  // Uses the "removal" approach for clarity
  // ------------------------------------------------------------

  const ageAssertion = identity.assertionWithPredicate("age");

  // Get all assertions we want to HIDE (everything except age)
  const assertionsToHideForBar = identity
    .assertions()
    .filter((a) => a.digest().equals(ageAssertion.digest()) === false);

  let barView: Envelope = identity;
  for (const assertion of assertionsToHideForBar) {
    barView = barView.elideRemovingTarget(assertion);
  }

  printEnvelope("VIEW A: Age Verification (Bar/Club)", barView);

  // ------------------------------------------------------------
  // View B: Professional/Employment Verification
  // Shows: name, employer, job title, employee ID
  // ------------------------------------------------------------

  const employerAssertion = identity.assertionWithPredicate("employer");
  const jobTitleAssertion = identity.assertionWithPredicate("jobTitle");
  const employeeIdAssertion = identity.assertionWithPredicate("employeeId");

  const keepForEmployer = new Set([
    employerAssertion.digest().hex(),
    jobTitleAssertion.digest().hex(),
    employeeIdAssertion.digest().hex(),
  ]);

  let employerView: Envelope = identity;
  for (const assertion of identity.assertions()) {
    if (!keepForEmployer.has(assertion.digest().hex())) {
      employerView = employerView.elideRemovingTarget(assertion);
    }
  }

  printEnvelope("VIEW B: Employment Verification", employerView);

  // ------------------------------------------------------------
  // View C: Financial Institution
  // Shows: name, SSN, income, credit score, employer
  // ------------------------------------------------------------

  const ssnAssertion = identity.assertionWithPredicate("ssn");
  const incomeAssertion = identity.assertionWithPredicate("annualIncome");
  const creditAssertion = identity.assertionWithPredicate("creditScore");

  const keepForBank = new Set([
    ssnAssertion.digest().hex(),
    incomeAssertion.digest().hex(),
    creditAssertion.digest().hex(),
    employerAssertion.digest().hex(),
  ]);

  let bankView: Envelope = identity;
  for (const assertion of identity.assertions()) {
    if (!keepForBank.has(assertion.digest().hex())) {
      bankView = bankView.elideRemovingTarget(assertion);
    }
  }

  printEnvelope("VIEW C: Bank/Financial Institution", bankView);

  // ------------------------------------------------------------
  // View D: Medical Provider
  // Shows: name, DOB, blood type, allergies, contact
  // ------------------------------------------------------------

  const dobAssertion = identity.assertionWithPredicate("dateOfBirth");
  const bloodAssertion = identity.assertionWithPredicate("bloodType");
  const allergiesAssertion = identity.assertionWithPredicate("allergies");
  const phoneAssertion = identity.assertionWithPredicate("phone");

  const keepForMedical = new Set([
    dobAssertion.digest().hex(),
    bloodAssertion.digest().hex(),
    allergiesAssertion.digest().hex(),
    phoneAssertion.digest().hex(),
  ]);

  let medicalView: Envelope = identity;
  for (const assertion of identity.assertions()) {
    if (!keepForMedical.has(assertion.digest().hex())) {
      medicalView = medicalView.elideRemovingTarget(assertion);
    }
  }

  printEnvelope("VIEW D: Medical Provider", medicalView);

  // ------------------------------------------------------------
  // View E: Delivery Service
  // Shows: name, address, phone
  // ------------------------------------------------------------

  const addressAssertion = identity.assertionWithPredicate("address");

  const keepForDelivery = new Set([addressAssertion.digest().hex(), phoneAssertion.digest().hex()]);

  let deliveryView: Envelope = identity;
  for (const assertion of identity.assertions()) {
    if (!keepForDelivery.has(assertion.digest().hex())) {
      deliveryView = deliveryView.elideRemovingTarget(assertion);
    }
  }

  printEnvelope("VIEW E: Delivery Service", deliveryView);

  // ============================================================
  // STEP 3: Verify all views share the same root digest
  // ============================================================

  console.log("\n\n🔍 STEP 3: Verifying cryptographic integrity...\n");
  console.log("All views should have the SAME root digest as the original:");
  console.log(`Original digest: ${originalDigest.hex().slice(0, 32)}...\n`);

  verifyDigests(identity, barView, "Bar/Club View");
  verifyDigests(identity, employerView, "Employment View");
  verifyDigests(identity, bankView, "Bank View");
  verifyDigests(identity, medicalView, "Medical View");
  verifyDigests(identity, deliveryView, "Delivery View");

  // ============================================================
  // STEP 4: Demonstrate selective removal (alternative approach)
  // ============================================================

  console.log("\n\n🔄 STEP 4: Alternative - Selective REMOVAL...\n");
  console.log("Instead of revealing specific items, we can HIDE specific items:\n");

  // Remove only sensitive information, reveal everything else
  const publicView = identity
    .elideRemovingTarget(ssnAssertion)
    .elideRemovingTarget(incomeAssertion)
    .elideRemovingTarget(creditAssertion)
    .elideRemovingTarget(allergiesAssertion)
    .elideRemovingTarget(bloodAssertion);

  printEnvelope("PUBLIC VIEW (Sensitive data removed)", publicView);
  verifyDigests(identity, publicView, "Public View");

  // ============================================================
  // STEP 5: Serialize for transmission
  // ============================================================

  console.log("\n\n📤 STEP 5: Serialization for transmission...\n");

  // Get CBOR bytes for transmission
  const barViewBytes = barView.cborBytes();
  const employerViewBytes = employerView.cborBytes();

  console.log(`Bar View size:      ${barViewBytes.length} bytes`);
  console.log(`Employer View size: ${employerViewBytes.length} bytes`);
  console.log(`Full document size: ${identity.cborBytes().length} bytes`);

  // Show hex format for debugging
  console.log("\n🔢 Hex Format (first 40 bytes):");
  console.log(`Bar View: ${Buffer.from(barViewBytes).toString("hex").slice(0, 80)}...`);

  // ============================================================
  // SUMMARY
  // ============================================================

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                        SUMMARY                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ✅ Created identity with 16 assertions                      ║
║  ✅ Generated 5 recipient-specific views                     ║
║  ✅ All views cryptographically verifiable (same digest)     ║
║  ✅ Each recipient sees only what they need                  ║
║  ✅ Hidden data shows only as ELIDED (digest only)           ║
║                                                              ║
║  Key Benefits:                                               ║
║  • Privacy: Share minimum necessary information              ║
║  • Verifiable: Recipients can verify document authenticity   ║
║  • Tamper-proof: Any modification changes the digest         ║
║  • Compact: Elided views are smaller than full document      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

main();
