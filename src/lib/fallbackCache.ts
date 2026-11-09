import {
  FullAnalysisResult,
  BlastRadiusSimulation,
  CharacterizationTestSuite,
  ForensicChatMessage,
} from '../types/legacy';

export const FALLBACK_ANALYSIS: FullAnalysisResult = {
  telemetry: {
    totalFiles: 4,
    totalLines: 499,
    techDebtScore: 84,
    hardcodedRulesCount: 5,
    criticalCouplingHotspots: 3,
    deadCodeLines: 28,
  },
  executiveSummary:
    'Core Retail Banking codebase exhibits severe structural coupling between database DDL (UserAuthSchema.sql) and batch application code (MonthlyBillingBatch.java:94). Critical financial business logic (withholding tax rate 18.5%) is hardcoded at LoanInterestEngine.java:84 and directly contradicts the archived architectural memo (which documented a 12.0% statutory rate). Additionally, 28 lines of completely dead magnetic tape reconciliation routines (decommissioned 2018) remain in production.',
  nodes: [
    {
      id: 'user-auth-schema',
      name: 'UserAuthSchema.sql',
      type: 'database',
      description: 'Legacy Core SQL schema declaring account tables, triggers, and coupled enum columns.',
      file: 'UserAuthSchema.sql',
      lines: '1–88',
      upstreamIds: [],
      downstreamIds: ['monthly-billing-batch'],
      status: 'warning',
      metrics: {
        lines: 88,
        complexity: 'Medium',
        riskScore: 78,
      },
      contracts: [
        'tbl_account_master(account_id, customer_tier, status_flag)',
        'tbl_account_ledger(account_id, tx_amount, tx_type)',
      ],
      plainEnglishLogic: [
        'Defines account tiers: STANDARD, SILVER, GOLD, PLATINUM.',
        'Enforces account status flags (Active, Suspended, Closed, Locked).',
        'Retains unused ghost column legacy_fax_optin from 2004.',
        'Runs trigger trg_audit_legacy_sync inserting audit entries on transactions > $10,000.',
      ],
    },
    {
      id: 'loan-interest-engine',
      name: 'LoanInterestEngine.java',
      type: 'service',
      description: 'Core financial calculation engine with hardcoded interest margins and statutory taxes.',
      file: 'LoanInterestEngine.java',
      lines: '1–142',
      upstreamIds: ['monthly-billing-batch'],
      downstreamIds: [],
      status: 'critical',
      metrics: {
        lines: 142,
        complexity: 'High',
        riskScore: 89,
      },
      contracts: [
        'calculateAnnualYield(principalBalance, customerTier, borrowerAge) -> double',
        'calculateNetWithholdingTax(annualYield, isTaxExempt) -> double',
      ],
      plainEnglishLogic: [
        'Computes base prime rate (3.25%) + tier margins (Platinum 1.25% up to Standard 4.5%).',
        'Applies senior citizen concession (-75 bps) for ages >= 60.',
        'Line 42: Hardcodes $35.50 overdraft penalty fee override.',
        'Line 84: Hardcodes 18.5% statutory withholding tax rate (violates 2015 tax reform memo).',
      ],
    },
    {
      id: 'monthly-billing-batch',
      name: 'MonthlyBillingBatch.java',
      type: 'batch',
      description: 'Monthly scheduled settlement processor directly reading raw SQL columns and posting credits/debits.',
      file: 'MonthlyBillingBatch.java',
      lines: '1–204',
      upstreamIds: ['user-auth-schema', 'loan-interest-engine'],
      downstreamIds: ['user-auth-schema'],
      status: 'critical',
      metrics: {
        lines: 204,
        complexity: 'Severe',
        riskScore: 92,
      },
      contracts: [
        'processMonthlySettlement(dbConn, targetBatchId) -> int processedCount',
        'reconcileLegacyTapeBatch(tapeDriveMountPath, blockSequence) -> List<String> [DEAD]',
      ],
      plainEnglishLogic: [
        'Executes raw SQL query joining tbl_account_master and tbl_account_ledger.',
        'Line 94: Directly retrieves rs.getString("customer_tier") without validation or null-safety.',
        'Line 118: Invokes LoanInterestEngine to compute monthly yield.',
        'Posts ledger transactions for interest credit and statutory tax debit.',
        'Lines 165–192: Obsolete magnetic tape header reconciliation (0 callers).',
      ],
    },
    {
      id: 'legacy-arch-notes',
      name: 'legacy_arch_notes_2016.txt',
      type: 'docs',
      description: 'Archived technical memo from 2016 containing outdated specifications and identified drift.',
      file: 'legacy_arch_notes_2016.txt',
      lines: '1–65',
      upstreamIds: [],
      downstreamIds: ['loan-interest-engine'],
      status: 'deprecated',
      metrics: {
        lines: 65,
        complexity: 'Low',
        riskScore: 65,
      },
      contracts: [
        'Architecture Memo & Known Drift Register',
      ],
      plainEnglishLogic: [
        'Specifies runtime cluster setup (JBoss EAP 6.4 + Oracle 11g RAC).',
        'Claims withholding tax was changed to 12.0% in 2016 (contradicted by code at line 84).',
        'Confirms tbl_account_master.legacy_fax_optin is 100% dead since 2009.',
        'Warns that customer_tier changes require coordination with Retail Ops clearinghouse.',
      ],
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'user-auth-schema',
      target: 'monthly-billing-batch',
      label: 'SQL Query & Column Coupling (L94)',
      type: 'query',
      severity: 'high',
    },
    {
      id: 'e2',
      source: 'monthly-billing-batch',
      target: 'loan-interest-engine',
      label: 'calculateAnnualYield() invocation (L118)',
      type: 'call',
      severity: 'high',
    },
    {
      id: 'e3',
      source: 'monthly-billing-batch',
      target: 'user-auth-schema',
      label: 'INSERT tbl_account_ledger (L130)',
      type: 'dependency',
      severity: 'medium',
    },
    {
      id: 'e4',
      source: 'legacy-arch-notes',
      target: 'loan-interest-engine',
      label: 'Doc Drift Contradiction (L84)',
      type: 'implicit',
      severity: 'high',
    },
  ],
  businessRules: [
    {
      id: 'br-1',
      name: 'Statutory Withholding Tax Rate',
      category: 'Taxation',
      description: 'Mandatory government withholding tax deducted from gross annual yield.',
      hardcodedValue: '18.5% (0.185)',
      file: 'LoanInterestEngine.java',
      lineStart: 84,
      lineEnd: 88,
      riskLevel: 'high',
      rationale:
        'Hardcoded directly into Java source code. Directly contradicts 2016 architecture memo (Statutory Act 109-B) which mandated 12.0%. Over-withholding tax on all customer payouts.',
    },
    {
      id: 'br-2',
      name: 'Overdraft Penalty Override Fee',
      category: 'Billing',
      description: 'Default flat charge assessed when balance falls below minimum threshold.',
      hardcodedValue: '$35.50',
      file: 'LoanInterestEngine.java',
      lineStart: 42,
      lineEnd: 43,
      riskLevel: 'medium',
      rationale:
        'Fixed constant from 2012 policy schedule. Cannot be adjusted per jurisdiction or tier without rebuilding and redeploying the Java artifact.',
    },
    {
      id: 'br-3',
      name: 'Senior Citizen Interest Subsidy',
      category: 'Interest',
      description: 'Concessionary rate reduction for account holders aged 60 years or older.',
      hardcodedValue: '-0.75% (-75 bps)',
      file: 'LoanInterestEngine.java',
      lineStart: 68,
      lineEnd: 71,
      riskLevel: 'medium',
      rationale:
        'Hardcoded age boundary (>= 60) and 75 bps reduction. Subject to compliance audit if customer age calculation is misaligned with national registry.',
    },
    {
      id: 'br-4',
      name: 'Junior Saver Yield Bonus',
      category: 'Interest',
      description: 'Promotional interest boost for minor and youth accounts under age 21.',
      hardcodedValue: '+0.50% (+50 bps)',
      file: 'LoanInterestEngine.java',
      lineStart: 43,
      lineEnd: 72,
      riskLevel: 'low',
      rationale:
        'Applies additional 50 bps yield bonus. Hardcoded age threshold (< 21) causes instant cliff drop on customer 21st birthday.',
    },
    {
      id: 'br-5',
      name: 'High-Value Transaction Audit Sync Threshold',
      category: 'Compliance',
      description: 'Database trigger logging transactions exceeding threshold into auth audit table.',
      hardcodedValue: '> $10,000.00',
      file: 'UserAuthSchema.sql',
      lineStart: 56,
      lineEnd: 60,
      riskLevel: 'high',
      rationale:
        'Hidden database trigger trg_audit_legacy_sync creates unexpected write contention on tbl_auth_audit_log for high-volume batch runs.',
    },
  ],
  ioContracts: [
    {
      id: 'ioc-1',
      module: 'LoanInterestEngine',
      file: 'LoanInterestEngine.java',
      functionName: 'calculateAnnualYield',
      inputs: [
        { name: 'principalBalance', type: 'double', required: true, description: 'Cleared account balance' },
        { name: 'customerTier', type: 'String', required: true, description: 'Tier from UserAuthSchema.sql (PLATINUM, GOLD, SILVER, STANDARD)' },
        { name: 'borrowerAge', type: 'int', required: true, description: 'Age in years for concession rules' },
      ],
      outputs: {
        type: 'double',
        description: 'Gross annual interest yield amount before withholding tax',
      },
      sideEffects: ['None (pure calculation)'],
      lineStart: 38,
      lineEnd: 73,
    },
    {
      id: 'ioc-2',
      module: 'LoanInterestEngine',
      file: 'LoanInterestEngine.java',
      functionName: 'calculateNetWithholdingTax',
      inputs: [
        { name: 'annualYield', type: 'double', required: true, description: 'Gross calculated yield' },
        { name: 'isTaxExempt', type: 'boolean', required: true, description: 'Tax exemption override flag' },
      ],
      outputs: {
        type: 'double',
        description: 'Calculated withholding tax rounded to 2 decimal places using HALF_UP',
      },
      sideEffects: ['Logs fine-level calculation trace to java.util.logging.Logger'],
      lineStart: 80,
      lineEnd: 92,
    },
    {
      id: 'ioc-3',
      module: 'MonthlyBillingBatch',
      file: 'MonthlyBillingBatch.java',
      functionName: 'processMonthlySettlement',
      inputs: [
        { name: 'dbConn', type: 'Connection', required: true, description: 'Live JDBC database connection' },
        { name: 'targetBatchId', type: 'String', required: true, description: 'Unique batch execution identifier' },
      ],
      outputs: {
        type: 'int',
        description: 'Number of active customer accounts settled and posted',
      },
      sideEffects: [
        'Executes SELECT against tbl_account_master & tbl_account_ledger',
        'Inserts INTEREST and TAX transaction rows into tbl_account_ledger',
        'Fires database trigger trg_audit_legacy_sync for entries > $10k',
      ],
      lineStart: 37,
      lineEnd: 90,
    },
  ],
  deadCode: {
    activeCriticalPath: [
      {
        id: 'dc-active-1',
        file: 'UserAuthSchema.sql',
        symbol: 'tbl_account_master.customer_tier',
        lineStart: 13,
        lineEnd: 13,
        reason: 'Directly queried in MonthlyBillingBatch.java:94 and evaluated in LoanInterestEngine.java:49-65. Renaming crashes batch.',
        safetyScore: 0,
        category: 'active',
      },
      {
        id: 'dc-active-2',
        file: 'LoanInterestEngine.java',
        symbol: 'calculateAnnualYield()',
        lineStart: 38,
        lineEnd: 73,
        reason: 'Invoked on every monthly billing settlement iteration at MonthlyBillingBatch.java:118.',
        safetyScore: 5,
        category: 'active',
      },
      {
        id: 'dc-active-3',
        file: 'MonthlyBillingBatch.java',
        symbol: 'processMonthlySettlement()',
        lineStart: 37,
        lineEnd: 90,
        reason: 'Main production entry point called by Linux cron on the 1st of each month.',
        safetyScore: 0,
        category: 'active',
      },
    ],
    tangledDependencies: [
      {
        id: 'dc-tangled-1',
        file: 'UserAuthSchema.sql',
        symbol: 'trg_audit_legacy_sync',
        lineStart: 52,
        lineEnd: 60,
        reason: 'Implicit side-effect trigger. MonthlyBillingBatch writes to tbl_account_ledger, secretly populating tbl_auth_audit_log.',
        safetyScore: 45,
        category: 'tangled',
      },
      {
        id: 'dc-tangled-2',
        file: 'LoanInterestEngine.java',
        symbol: 'calculateTenureDaysLegacy()',
        lineStart: 99,
        lineEnd: 106,
        reason: 'Marked @Deprecated. Uses java.util.Date millisecond division susceptible to leap second and daylight saving drift.',
        safetyScore: 55,
        category: 'tangled',
      },
    ],
    safeToRetire: [
      {
        id: 'dc-retire-1',
        file: 'MonthlyBillingBatch.java',
        symbol: 'reconcileLegacyTapeBatch()',
        lineStart: 165,
        lineEnd: 192,
        reason: 'Completely unreferenced magnetic tape backup routine. Tape drives were decommissioned in 2018. 0 calls across entire codebase.',
        safetyScore: 99,
        linesSaved: 28,
        category: 'dead',
      },
      {
        id: 'dc-retire-2',
        file: 'UserAuthSchema.sql',
        symbol: 'legacy_fax_optin',
        lineStart: 18,
        lineEnd: 18,
        reason: 'Fax trade confirmation service was decommissioned in 2009. Unreferenced by any Java, SQL or batch process.',
        safetyScore: 98,
        linesSaved: 1,
        category: 'dead',
      },
      {
        id: 'dc-retire-3',
        file: 'LoanInterestEngine.java',
        symbol: 'applyManualInterventionOverride()',
        lineStart: 111,
        lineEnd: 116,
        reason: 'Temporary patch from 2013 audit. Never wired into batch execution pipeline or REST controller.',
        safetyScore: 92,
        linesSaved: 6,
        category: 'dead',
      },
    ],
    summary: {
      totalDeadLines: 35,
      overallCouplingIndex: 78,
      recommendedFirstAction: 'Safely delete MonthlyBillingBatch.java lines 165-192 (reconcileLegacyTapeBatch) to reclaim 28 lines of dead code.',
    },
  },
};

export const FALLBACK_SIMULATION: BlastRadiusSimulation = {
  targetSymbol: 'customer_tier',
  targetFile: 'UserAuthSchema.sql',
  proposedChange: 'Rename customer_tier column to account_level in UserAuthSchema.sql:13',
  blastRadiusScore: 88,
  severity: 'HIGH',
  summary:
    'Renaming customer_tier directly breaks downstream batch settlement in MonthlyBillingBatch.java:94 and invalidates database index idx_acct_tier_status. Runtime execution will throw immediate SQLException: Column "customer_tier" not found during nightly batch execution.',
  affectedModules: [
    {
      file: 'MonthlyBillingBatch.java',
      line: 94,
      symbol: 'rs.getString("customer_tier")',
      impactType: 'Breaking API',
      description: 'Nightly batch settlement will crash with SQLException: Column "customer_tier" not found.',
    },
    {
      file: 'MonthlyBillingBatch.java',
      line: 41,
      symbol: 'SELECT query string',
      impactType: 'Type Mismatch',
      description: 'Hardcoded raw SQL SELECT projection references old column name customer_tier.',
    },
    {
      file: 'UserAuthSchema.sql',
      line: 23,
      symbol: 'idx_acct_tier_status',
      impactType: 'Implicit Dependency',
      description: 'Compound index on (customer_tier, status_flag) fails DDL execution with invalid column error.',
    },
    {
      file: 'LoanInterestEngine.java',
      line: 49,
      symbol: 'calculateAnnualYield(..., customerTier, ...)',
      impactType: 'Data Truncation',
      description: 'If downstream passes null or empty string due to SQL fallback, interest rate falls back to default STANDARD margin (+4.5%), overcharging Platinum/Gold accounts.',
    },
  ],
  sideEffects: [
    'Nightly batch job will terminate abnormally midway through processing, leaving ledger in uncommitted state.',
    'Ledger balance reconciliation will fail between core banking and audit logs.',
    'Customer interest payouts will be delayed until DBA hotfix is deployed.',
  ],
  refactoringChecklist: [
    {
      step: 1,
      task: 'Create temporary SQL View or synonym tbl_account_master_compat mapping customer_tier = account_level.',
      file: 'UserAuthSchema.sql',
      estimatedRisk: 'LOW',
    },
    {
      step: 2,
      task: 'Update MonthlyBillingBatch.java:41 & 94 to read new account_level column with fallback to customer_tier.',
      file: 'MonthlyBillingBatch.java',
      estimatedRisk: 'MEDIUM',
    },
    {
      step: 3,
      task: 'Update index idx_acct_tier_status in DDL migration script.',
      file: 'UserAuthSchema.sql',
      estimatedRisk: 'LOW',
    },
    {
      step: 4,
      task: 'Run characterization test suite against LoanInterestEngine to verify all 4 tiers calculate identical yield.',
      file: 'LoanInterestEngineTest.java',
      estimatedRisk: 'LOW',
    },
    {
      step: 5,
      task: 'Drop legacy customer_tier column after 30-day dual-run deprecation period.',
      file: 'UserAuthSchema.sql',
      estimatedRisk: 'HIGH',
    },
  ],
};

export const FALLBACK_TEST_SUITE: CharacterizationTestSuite = {
  file: 'LoanInterestEngine.java',
  targetUnit: 'calculateAnnualYield & calculateNetWithholdingTax',
  framework: 'JUnit 5',
  rationale:
    'Characterization tests capture existing legacy behavior—including hardcoded 18.5% tax withholding and senior citizen concessions—ensuring refactoring does not silently distort customer balances.',
  code: `package com.bank.core.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Legacy Characterization Test Suite - LoanInterestEngine")
class LoanInterestEngineTest {

    private LoanInterestEngine engine;

    @BeforeEach
    void setUp() {
        engine = new LoanInterestEngine();
    }

    @Nested
    @DisplayName("calculateAnnualYield Characterization")
    class YieldCalculations {

        @Test
        @DisplayName("Happy Path: Standard tier for middle-aged adult (45 yrs, $10,000 balance)")
        void testStandardTierMiddleAge() {
            // Base 3.25% + Standard 4.5% = 7.75% = $775.00
            double yield = engine.calculateAnnualYield(10000.0, "STANDARD", 45);
            assertEquals(775.0, yield, 0.0001, "Standard tier yield mismatch at line 64");
        }

        @Test
        @DisplayName("Critical Edge Case: Senior citizen (age >= 60) gets 75 bps discount (Line 68)")
        void testSeniorCitizenSubsidy() {
            // Base 3.25% + Platinum 1.25% - Senior 0.75% = 3.75% = $375.00
            double yield = engine.calculateAnnualYield(10000.0, "PLATINUM", 60);
            assertEquals(375.0, yield, 0.0001, "Senior discount rule failed at line 68");
        }

        @Test
        @DisplayName("Edge Case: Youth account under 21 gets 50 bps bonus (Line 70)")
        void testJuniorSaverSubsidy() {
            // Base 3.25% + Gold 2.1% + Junior 0.5% = 5.85% = $585.00
            double yield = engine.calculateAnnualYield(10000.0, "GOLD", 19);
            assertEquals(585.0, yield, 0.0001, "Junior saver subsidy failed at line 70");
        }

        @Test
        @DisplayName("Defensive Trap: Zero or negative principal balance returns 0.0")
        void testZeroOrNegativePrincipal() {
            assertEquals(0.0, engine.calculateAnnualYield(0.0, "GOLD", 35));
            assertEquals(0.0, engine.calculateAnnualYield(-500.0, "PLATINUM", 35));
        }

        @ParameterizedTest(name = "Tier {0} should map properly")
        @CsvSource({
            "PLATINUM, 450.0", // 3.25 + 1.25 = 4.5% = $450
            "GOLD,     535.0", // 3.25 + 2.10 = 5.35% = $535
            "SILVER,   645.0", // 3.25 + 3.20 = 6.45% = $645
            "UNKNOWN,  775.0"  // defaults to standard 7.75% = $775
        })
        void testAllTiers(String tier, double expectedYield) {
            double yield = engine.calculateAnnualYield(10000.0, tier, 40);
            assertEquals(expectedYield, yield, 0.0001);
        }
    }

    @Nested
    @DisplayName("calculateNetWithholdingTax Characterization")
    class WithholdingTaxCalculations {

        @Test
        @DisplayName("Line 84 Verification: Statutory rate is strictly 18.5% (contrary to 2016 arch doc)")
        void testStatutoryWithholdingRate18Point5Percent() {
            double annualYield = 1000.00;
            double tax = engine.calculateNetWithholdingTax(annualYield, false);
            // 18.5% of $1000 = $185.00
            assertEquals(185.00, tax, 0.01, "Withholding tax must match 18.5% formula at line 84");
        }

        @Test
        @DisplayName("Tax exempt flag bypasses withholding tax completely")
        void testTaxExemptFlag() {
            double tax = engine.calculateNetWithholdingTax(1000.00, true);
            assertEquals(0.0, tax, 0.0001);
        }

        @Test
        @DisplayName("Boundary: Zero or negative yield incurs zero tax")
        void testZeroYieldNoTax() {
            assertEquals(0.0, engine.calculateNetWithholdingTax(0.0, false));
            assertEquals(0.0, engine.calculateNetWithholdingTax(-100.0, false));
        }
    }
}`,
  tests: [
    {
      id: 'tc-1',
      name: 'Happy Path: Standard tier adult yield calculation',
      category: 'Happy Path',
      description: 'Verifies base prime rate (3.25%) + standard tier margin (4.5%) equals 7.75% yield.',
      targetLineCitation: 'LoanInterestEngine.java:64',
      status: 'verified',
    },
    {
      id: 'tc-2',
      name: 'Senior Citizen Boundary: Exact age 60 threshold concession',
      category: 'Boundary/Null',
      description: 'Tests that customer turning exactly 60 receives the 75 bps regulatory rate concession.',
      targetLineCitation: 'LoanInterestEngine.java:68',
      status: 'verified',
    },
    {
      id: 'tc-3',
      name: 'Statutory Withholding: Hardcoded 18.5% rate audit lock',
      category: 'Hardcoded Rule Verification',
      description: 'Locks in exact 18.5% withholding tax behavior to prevent silent drift during modernization.',
      targetLineCitation: 'LoanInterestEngine.java:84',
      status: 'verified',
    },
    {
      id: 'tc-4',
      name: 'Defensive Legacy Trap: Unknown tier fallback to Standard',
      category: 'Defensive Legacy Trap',
      description: 'Ensures invalid or unmapped tier strings do not crash the engine and fallback safely.',
      targetLineCitation: 'LoanInterestEngine.java:63',
      status: 'verified',
    },
  ],
};

export const FALLBACK_CHAT_RESPONSES: Record<string, ForensicChatMessage> = {
  default: {
    id: 'msg-default',
    sender: 'assistant',
    text: `Based on forensic static analysis across the ingested legacy repository:

1. **Schema & Application Coupling**:
   - \`UserAuthSchema.sql:13\` defines \`customer_tier\` which is queried directly via raw SQL in \`MonthlyBillingBatch.java:94\` (\`rs.getString("customer_tier")\`).
   - Any schema alterations will trigger immediate batch settlement crashes.

2. **Hardcoded Financial Rules**:
   - \`LoanInterestEngine.java:84\` hardcodes statutory withholding tax at **18.5%**, directly contradicting \`legacy_arch_notes_2016.txt:28\` (which stated the rate was updated to 12.0%).

3. **Dead Code**:
   - \`MonthlyBillingBatch.java:165-192\` contains an uncalled \`reconcileLegacyTapeBatch()\` routine from 2018 that can be safely retired with zero risk.`,
    timestamp: Date.now(),
    citations: [
      { file: 'LoanInterestEngine.java', lineStart: 84, lineEnd: 88 },
      { file: 'MonthlyBillingBatch.java', lineStart: 94, lineEnd: 98 },
      { file: 'UserAuthSchema.sql', lineStart: 13, lineEnd: 15 },
      { file: 'MonthlyBillingBatch.java', lineStart: 165, lineEnd: 192 },
    ],
  },
  tax: {
    id: 'msg-tax',
    sender: 'assistant',
    text: `The interest withholding tax rule is hardcoded in \`LoanInterestEngine.java:84\`:
\`\`\`java
double statutoryTaxRate = 0.185; 
double withholdingTax = annualYield * statutoryTaxRate;
\`\`\`
**Forensic Discrepancy Found:**
According to \`legacy_arch_notes_2016.txt:28\`, Statutory Act 109-B mandated reducing the tax rate to **12.0%** in 2015. However, static analysis proves the reduction was never implemented in \`LoanInterestEngine.java\`. Customers have been billed at 18.5% continuously.`,
    timestamp: Date.now(),
    citations: [
      { file: 'LoanInterestEngine.java', lineStart: 84, lineEnd: 88 },
      { file: 'legacy_arch_notes_2016.txt', lineStart: 25, lineEnd: 32 },
    ],
  },
  services: {
    id: 'msg-services',
    sender: 'assistant',
    text: `If \`UserAuthSchema.sql\` is altered (e.g. modifying or renaming \`customer_tier\`):

1. **\`MonthlyBillingBatch.java:94\`** will break immediately because it uses a raw JDBC string lookup \`rs.getString("customer_tier")\`.
2. **\`LoanInterestEngine.java:49-65\`** will fail to match the tier string, falling through to the default \`STANDARD\` tier (+4.5% margin), causing financial discrepancies for Platinum/Gold customers.
3. Database index \`idx_acct_tier_status\` on line 23 will fail during migration.`,
    timestamp: Date.now(),
    citations: [
      { file: 'MonthlyBillingBatch.java', lineStart: 94, lineEnd: 98 },
      { file: 'LoanInterestEngine.java', lineStart: 49, lineEnd: 65 },
      { file: 'UserAuthSchema.sql', lineStart: 23, lineEnd: 24 },
    ],
  },
  dead: {
    id: 'msg-dead',
    sender: 'assistant',
    text: `Static analysis detected **28 lines of dead code** in \`MonthlyBillingBatch.java:165-192\`:
The method \`reconcileLegacyTapeBatch(String tapeDriveMountPath, int blockSequence)\` has **zero callers** across all files.

As documented in \`legacy_arch_notes_2016.txt:38\`, physical magnetic tape drives were decommissioned in 2018 and migrated to SAN storage. This routine has a **Safety Score of 99/100** and can be removed immediately.`,
    timestamp: Date.now(),
    citations: [
      { file: 'MonthlyBillingBatch.java', lineStart: 165, lineEnd: 192 },
      { file: 'legacy_arch_notes_2016.txt', lineStart: 35, lineEnd: 42 },
    ],
  },
};
