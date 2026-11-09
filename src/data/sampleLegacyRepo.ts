import { CodeFile } from '../types/legacy';

export const SAMPLE_LEGACY_REPO: CodeFile[] = [
  {
    id: 'user-auth-schema',
    name: 'UserAuthSchema.sql',
    path: 'db/schema/UserAuthSchema.sql',
    language: 'sql',
    lineCount: 88,
    sizeBytes: 3120,
    content: `-- ============================================================================
-- LEGACY ENTERPRISE BANKING CORE - AUTH & ACCOUNTS SCHEMA
-- Revision: 4.12 (Last modified: 2014-08-19 by DBA Team)
-- WARNING: HIGHLY COUPLED SCHEMA - DO NOT DROP COLUMNS WITHOUT PERMISSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS tbl_account_master (
    account_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_uuid VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(120) NOT NULL,
    customer_tier VARCHAR(16) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD', 'SILVER', 'GOLD', 'PLATINUM'
    account_type_cd VARCHAR(8) NOT NULL, -- 'CHK', 'SAV', 'MORT', 'COMM'
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_flag CHAR(1) NOT NULL DEFAULT 'A', -- 'A'=Active, 'S'=Suspended, 'C'=Closed, 'L'=Locked
    kyc_verified_bit TINYINT(1) DEFAULT 0,
    legacy_fax_optin BOOLEAN DEFAULT FALSE, -- GHOST COLUMN: Added in 2004 for physical fax trade confirmations; unused since 2009
    risk_score_override INT DEFAULT NULL,
    branch_routing_code VARCHAR(10) NOT NULL,
    CONSTRAINT chk_status_flag CHECK (status_flag IN ('A', 'S', 'C', 'L'))
);

CREATE INDEX idx_acct_tier_status ON tbl_account_master(customer_tier, status_flag);
CREATE INDEX idx_branch_routing ON tbl_account_master(branch_routing_code);

CREATE TABLE IF NOT EXISTS tbl_account_ledger (
    entry_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL,
    tx_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tx_amount DECIMAL(18, 4) NOT NULL,
    currency_iso VARCHAR(3) NOT NULL DEFAULT 'USD',
    tx_type VARCHAR(12) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'INTEREST', 'TAX'
    balance_after DECIMAL(18, 4) NOT NULL,
    correlated_batch_id VARCHAR(40) NULL,
    is_cleared TINYINT(1) DEFAULT 1,
    FOREIGN KEY (account_id) REFERENCES tbl_account_master(account_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tbl_auth_audit_log (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL,
    login_attempt_ip VARCHAR(45) NOT NULL,
    success_indicator CHAR(1) NOT NULL,
    session_token_hash VARCHAR(128) NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES tbl_account_master(account_id)
);

-- Deprecated 2011 trigger for tape backup synchronization
DELIMITER $$
CREATE TRIGGER trg_audit_legacy_sync
AFTER INSERT ON tbl_account_ledger
FOR EACH ROW
BEGIN
    -- WARNING: Implicitly relied on by MonthlyBillingBatch via raw table checks
    IF NEW.tx_amount > 10000.00 THEN
        INSERT INTO tbl_auth_audit_log (account_id, login_attempt_ip, success_indicator)
        VALUES (NEW.account_id, '127.0.0.1:INTERNAL_TRIGGER', 'Y');
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- NOTE FOR DEVELOPERS:
-- customer_tier is tightly coupled across MonthlyBillingBatch.java (line 94)
-- and LoanInterestEngine.java. Renaming or modifying enum values will
-- trigger immediate ClassCastException / silent calculation errors.
-- ============================================================================`
  },
  {
    id: 'loan-interest-engine',
    name: 'LoanInterestEngine.java',
    path: 'src/main/java/com/bank/core/engine/LoanInterestEngine.java',
    language: 'java',
    lineCount: 142,
    sizeBytes: 5240,
    content: `package com.bank.core.engine;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.logging.Logger;

/**
 * LoanInterestEngine - Core Legacy Interest Calculation Service.
 * Maintained since 2008. Contains critical regulatory formulas.
 *
 * CAUTION: Do NOT modify formulas without Compliance Committee signoff.
 */
public class LoanInterestEngine {

    private static final Logger LOGGER = Logger.getLogger(LoanInterestEngine.class.getName());

    // HARDCODED BUSINESS POLICY - TICKET #892 (2012)
    public static final double DEFAULT_BASE_PRIME_RATE = 0.0325; // 3.25% annual base
    public static final double TIER_STANDARD_MARGIN = 0.0450;    // +4.5%
    public static final double TIER_SILVER_MARGIN = 0.0320;      // +3.2%
    public static final double TIER_GOLD_MARGIN = 0.0210;        // +2.1%
    public static final double TIER_PLATINUM_MARGIN = 0.0125;    // +1.25%

    // Line 42: HARDCODED OVERDRAFT PENALTY RATE (CRITICAL AUDIT ITEM)
    private static final double BASE_OVERDRAFT_FEE = 35.50; // Hardcoded 2012 fee schedule; overrides DB if null
    private static final double JUNIOR_SAVER_SUBSIDY = 0.005; // 0.5% boost for youth accounts under 21

    /**
     * Calculates the annual interest yield for loan & deposit accounts.
     * Invoked downstream by MonthlyBillingBatch.java:118.
     *
     * @param principalBalance Current cleared balance
     * @param customerTier     Tier string mapped from UserAuthSchema.sql
     * @param borrowerAge      Age in years (used for senior citizen tax concessions)
     * @return Gross annual yield before tax withholding
     */
    public double calculateAnnualYield(double principalBalance, String customerTier, int borrowerAge) {
        if (principalBalance <= 0) {
            return 0.0;
        }

        double effectiveRate = DEFAULT_BASE_PRIME_RATE;

        // Tight coupling to tbl_account_master.customer_tier
        if ("PLATINUM".equalsIgnoreCase(customerTier)) {
            effectiveRate += TIER_PLATINUM_MARGIN;
        } else if ("GOLD".equalsIgnoreCase(customerTier)) {
            effectiveRate += TIER_GOLD_MARGIN;
        } else if ("SILVER".equalsIgnoreCase(customerTier)) {
            effectiveRate += TIER_SILVER_MARGIN;
        } else {
            // Default to standard margin
            effectiveRate += TIER_STANDARD_MARGIN;
        }

        // Regulatory concession rule: Senior Citizens (Age >= 60) receive 75 bps discount
        if (borrowerAge >= 60) {
            effectiveRate -= 0.0075; // -0.75% subsidy rule per 2011 Senior Banking Directive
        } else if (borrowerAge < 21) {
            effectiveRate += JUNIOR_SAVER_SUBSIDY;
        }

        return principalBalance * effectiveRate;
    }

    /**
     * Calculates Net Payout after Withholding Tax.
     *
     * Line 84: HARDCODED 18.5% STATUTORY WITHHOLDING TAX
     * NOTE: Directly contradicts legacy_arch_notes_2016.txt (which claims 12.0%).
     */
    public double calculateNetWithholdingTax(double annualYield, boolean isTaxExempt) {
        if (isTaxExempt || annualYield <= 0.0) {
            return 0.0;
        }

        // Line 84: HARDCODED REGULATORY TAX 18.5% (Do not touch - Legal ticket 4410)
        double statutoryTaxRate = 0.185; 
        double withholdingTax = annualYield * statutoryTaxRate;

        LOGGER.fine("Calculated statutory withholding tax: $" + withholdingTax + " on yield: $" + annualYield);
        return BigDecimal.valueOf(withholdingTax).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    /**
     * Deprecated date delta calculation using legacy java.util.Date.
     * Susceptible to daylight saving jumps and timezone drift.
     */
    @Deprecated
    public long calculateTenureDaysLegacy(Date issueDate, Date maturityDate) {
        if (issueDate == null || maturityDate == null) {
            return 0L;
        }
        // Potential bug: integer millisecond overflow for maturities > 24.8 days if cast improperly
        long diffMillis = maturityDate.getTime() - issueDate.getTime();
        return diffMillis / (1000L * 60 * 60 * 24);
    }

    /**
     * Emergency manual override method added in 2013 during audit.
     */
    public double applyManualInterventionOverride(double originalFee, double overrideMultiplier) {
        if (overrideMultiplier < 0.0) {
            return BASE_OVERDRAFT_FEE;
        }
        return originalFee * overrideMultiplier;
    }
}`
  },
  {
    id: 'monthly-billing-batch',
    name: 'MonthlyBillingBatch.java',
    path: 'src/main/java/com/bank/batch/billing/MonthlyBillingBatch.java',
    language: 'java',
    lineCount: 204,
    sizeBytes: 7480,
    content: `package com.bank.batch.billing;

import com.bank.core.engine.LoanInterestEngine;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * MonthlyBillingBatch - Nightly/Monthly Settlement Batch Processor.
 * Invoked on the 1st calendar day of each month via Linux Crontab.
 *
 * DIRECT UPSTREAM DEPENDENCIES:
 * 1. UserAuthSchema.sql (tbl_account_master, tbl_account_ledger)
 * 2. LoanInterestEngine.java (calculateAnnualYield, calculateNetWithholdingTax)
 */
public class MonthlyBillingBatch {

    private static final Logger LOGGER = Logger.getLogger(MonthlyBillingBatch.class.getName());

    private final LoanInterestEngine interestEngine;

    public MonthlyBillingBatch() {
        this.interestEngine = new LoanInterestEngine();
    }

    /**
     * Core processing loop for monthly customer settlement.
     */
    public int processMonthlySettlement(Connection dbConn, String targetBatchId) throws SQLException {
        int processedRecordCount = 0;

        String selectQuery = "SELECT a.account_id, a.customer_tier, a.status_flag, " +
                             "       COALESCE(SUM(l.tx_amount), 0.0) AS current_balance " +
                             "FROM tbl_account_master a " +
                             "LEFT JOIN tbl_account_ledger l ON a.account_id = l.account_id " +
                             "WHERE a.status_flag = 'A' " +
                             "GROUP BY a.account_id, a.customer_tier, a.status_flag";

        try (PreparedStatement stmt = dbConn.prepareStatement(selectQuery);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                long accountId = rs.getLong("account_id");
                
                // Line 94: DIRECT SCHEMA COUPLING TO UserAuthSchema.sql
                // If customer_tier is renamed to account_level or modified in SQL, this throws SQLException!
                String customerTier = rs.getString("customer_tier");
                String statusFlag = rs.getString("status_flag");
                double currentBalance = rs.getDouble("current_balance");

                if (!"A".equalsIgnoreCase(statusFlag)) {
                    continue;
                }

                int mockBorrowerAge = 45; // Default age when profile service is unlinked

                // Line 118: DIRECT COUPLING TO LoanInterestEngine.java
                // Calling calculateAnnualYield() with raw tier string
                double grossAnnualYield = interestEngine.calculateAnnualYield(currentBalance, customerTier, mockBorrowerAge);
                double monthlyInterestPortion = grossAnnualYield / 12.0;

                // Line 122: DIRECT COUPLING TO Line 84 Withholding Tax formula
                double taxDeduction = interestEngine.calculateNetWithholdingTax(monthlyInterestPortion, false);
                double netCredit = monthlyInterestPortion - taxDeduction;

                // Post ledger entry for interest credit
                postLedgerEntry(dbConn, accountId, netCredit, "INTEREST", targetBatchId);

                // Post ledger entry for withholding tax debit
                if (taxDeduction > 0) {
                    postLedgerEntry(dbConn, accountId, -taxDeduction, "TAX", targetBatchId);
                }

                processedRecordCount++;
            }
        } catch (SQLException ex) {
            LOGGER.log(Level.SEVERE, "Failed executing monthly settlement batch for ID: " + targetBatchId, ex);
            throw ex;
        }

        return processedRecordCount;
    }

    private void postLedgerEntry(Connection conn, long accountId, double amount, String txType, String batchId) throws SQLException {
        String insertSql = "INSERT INTO tbl_account_ledger " +
                           "(account_id, tx_amount, tx_type, balance_after, correlated_batch_id) " +
                           "VALUES (?, ?, ?, 0.0, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
            stmt.setLong(1, accountId);
            stmt.setDouble(2, amount);
            stmt.setString(3, txType);
            stmt.setString(4, batchId);
            stmt.executeUpdate();
        }
    }

    // ========================================================================
    // DEAD CODE & GHOST DEPENDENCY HUNTER TARGET
    // Lines 165–192: Completely orphaned magnetic tape backup reconciliation.
    // Never referenced by any production job since 2018. Safe to retire.
    // ========================================================================
    /**
     * @deprecated RECONCILE_MAGNETIC_TAPE_BATCH - DECOMMISSIONED 2018
     * Safe-to-Retire Dead Code: lines 165 to 192.
     * Retained solely due to institutional fear of legacy tape driver breakages.
     */
    @Deprecated
    public List<String> reconcileLegacyTapeBatch(String tapeDriveMountPath, int blockSequence) {
        LOGGER.warning("CRITICAL: Executing obsolete magnetic tape reconciliation routine: " + tapeDriveMountPath);
        List<String> reconciliationLogs = new ArrayList<>();
        
        // Simulating legacy IBM 3480 magnetic tape header verification
        if (tapeDriveMountPath == null || tapeDriveMountPath.isEmpty()) {
            reconciliationLogs.add("ERR_MOUNT_FAILED: Tape drive path was null or empty.");
            return reconciliationLogs;
        }

        for (int i = 0; i < blockSequence; i++) {
            reconciliationLogs.add("VERIFIED_BLOCK_" + i + "_CRC32_CHECK_PASSED");
        }
        
        reconciliationLogs.add("STATUS: TAPE RECONCILIATION COMPLETED WITH 0 ERRORS.");
        return reconciliationLogs;
    }

    public boolean healthCheck() {
        return this.interestEngine != null;
    }
}`
  },
  {
    id: 'legacy-arch-notes',
    name: 'legacy_arch_notes_2016.txt',
    path: 'docs/architecture/legacy_arch_notes_2016.txt',
    language: 'text',
    lineCount: 65,
    sizeBytes: 2450,
    content: `===============================================================================
PROJECT PHOENIX: CORE RETAIL BANKING ARCHITECTURE SPEC (ARCHIVED 2016-11)
AUTHOR: Arch Lead (Dave M., retired)
CLASSIFICATION: INTERNAL TECHNICAL MEMO / CONFLUENCE EXPORT
===============================================================================

1. OVERVIEW & RUNTIME TOPOLOGY:
The Core Retail Banking engine operates on dual JBoss EAP 6.4 clusters connected
to an Oracle 11g RAC database (UserAuthSchema.sql). 
Batch jobs run nightly under control of cron jobs calling MonthlyBillingBatch.

2. CRITICAL DEPENDENCY CHAINS:
- UserAuthSchema.sql defines tbl_account_master.
  Note: Columns customer_tier ('STANDARD', 'SILVER', 'GOLD', 'PLATINUM') are 
  strictly coupled to MonthlyBillingBatch.java.
  DO NOT ALTER customer_tier without contacting the Retail Ops clearinghouse!

- LoanInterestEngine.java performs all calculations.
  Note on senior citizen tiers: Senior citizens (age 60+) receive subsidized rates.
  Youth accounts under 21 receive 50 bps bonus.

3. CONTRADICTIONS & KNOWN DRIFT (WARNING FOR MODERNIZATION TEAMS):
- TAX WITHHOLDING DRIFT:
  According to 2015 tax reform (Statutory Act 109-B), statutory withholding was
  mandated to be reduced from 18.5% down to 12.0%.
  Arch memo notes that "LoanInterestEngine was patched to 12.0% in Q1 2016."
  [VERIFICATION FAILED: Static analysis reveals LoanInterestEngine.java:84 STILL
   HARDBODES 18.5% (0.185). The 2015 tax reduction was NEVER committed to prod!]

- DEAD GHOST COLUMNS:
  tbl_account_master.legacy_fax_optin is 100% obsolete. Fax clearinghouse was
  decommissioned in October 2009. Safe to drop with zero side-effects.

- DEAD TAPE RECONCILIATION:
  MonthlyBillingBatch.reconcileLegacyTapeBatch() was decommissioned when tape
  vault was migrated to SAN in 2018. It is never called.

4. REFACTORING ROADMAP RECOMMENDATIONS:
1. Wrap tbl_account_master in an anti-corruption layer (ACL) or View.
2. Externalize LoanInterestEngine.java hardcoded rates into a dynamic rule engine.
3. Eliminate MonthlyBillingBatch SQL string concatenation to prevent SQL injection.
4. Generate strict characterization tests around line 84 before modifying withholding rate.
===============================================================================`
  }
];
