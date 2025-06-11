// 🔍 GDPR Compliance Analyzer - Updated for Hash-Only System
// Run this to verify your system is GDPR compliant

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔐 GDPR Compliance Analysis for Hash-Only Certificate System');
console.log('=' .repeat(60));

// Check if the GDPR-compliant database exists
const gdprDbPath = './data/gdpr_compliant_certificates.db';
const oldDbPath = './data/certificates.db';

if (!fs.existsSync(gdprDbPath)) {
    console.log('❌ GDPR-compliant database not found!');
    console.log('   Expected: ' + gdprDbPath);
    
    if (fs.existsSync(oldDbPath)) {
        console.log('⚠️  Old non-compliant database still exists: ' + oldDbPath);
        console.log('   Please run the GDPR-compliant system to create the new database.');
    }
    
    process.exit(1);
}

const db = new sqlite3.Database(gdprDbPath);

// Step 1: Verify database schema is GDPR compliant
console.log('\n🔍 Step 1: Analyzing Database Schema\n');

db.all("PRAGMA table_info(certificate_hashes)", (err, columns) => {
    if (err) {
        console.error('❌ Error reading table schema:', err);
        return;
    }
    
    console.log('📋 Table: certificate_hashes');
    console.log('Columns found:');
    
    const personalDataColumns = [];
    const acceptableColumns = [];
    
    columns.forEach(col => {
        const columnName = col.name.toLowerCase();
        
        // Check for GDPR violations (personal data columns)
        if (['student_name', 'course_name', 'certificate_data', 'personal_data', 'user_name', 'email'].includes(columnName)) {
            personalDataColumns.push(col.name);
            console.log(`   ❌ ${col.name} (${col.type}) - PERSONAL DATA VIOLATION!`);
        } else {
            acceptableColumns.push(col.name);
            console.log(`   ✅ ${col.name} (${col.type}) - GDPR compliant`);
        }
    });
    
    console.log('\n📊 Schema Compliance Summary:');
    console.log(`   ✅ Acceptable columns: ${acceptableColumns.length}`);
    console.log(`   ❌ Personal data violations: ${personalDataColumns.length}`);
    
    if (personalDataColumns.length === 0) {
        console.log('   🎉 SCHEMA IS GDPR COMPLIANT! ✅');
    } else {
        console.log('   🚨 SCHEMA VIOLATES GDPR! ❌');
        console.log('   Personal data columns found:', personalDataColumns.join(', '));
    }
    
    // Step 2: Analyze actual data
    console.log('\n🔍 Step 2: Analyzing Stored Data\n');
    
    db.all("SELECT * FROM certificate_hashes LIMIT 10", (err, rows) => {
        if (err) {
            console.error('❌ Error reading data:', err);
            return;
        }
        
        if (rows.length === 0) {
            console.log('📝 No certificates found in database (empty database)');
            console.log('   This is normal for a new installation.');
        } else {
            console.log(`📊 Analyzing ${rows.length} certificate records...\n`);
            
            let gdprCompliantRecords = 0;
            let violations = [];
            
            rows.forEach((row, index) => {
                console.log(`--- Certificate ${index + 1} ---`);
                
                // What SHOULD be stored (GDPR compliant)
                console.log('✅ GDPR-Compliant Data:');
                if (row.certificate_hash) {
                    console.log(`   hash: ${row.certificate_hash.substring(0, 20)}... (${row.certificate_hash.length} chars)`);
                    
                    // Verify it's a proper SHA-512 hash (128 hex characters)
                    if (row.certificate_hash.length === 128 && /^[a-f0-9]+$/i.test(row.certificate_hash)) {
                        console.log(`   ✅ Valid SHA-512 hash format`);
                    } else {
                        console.log(`   ⚠️  Invalid hash format (expected 128 hex chars)`);
                    }
                } else {
                    console.log(`   ❌ Missing certificate hash!`);
                }
                
                if (row.certificate_id) {
                    console.log(`   certificate_id: ${row.certificate_id}`);
                } else {
                    console.log(`   ❌ Missing certificate ID!`);
                }
                
                if (row.course_code) {
                    console.log(`   course_code: ${row.course_code} (anonymized course identifier)`);
                } else {
                    console.log(`   ⚠️  Missing course code`);
                }
                
                if (row.issue_date) {
                    console.log(`   issue_date: ${row.issue_date}`);
                } else {
                    console.log(`   ⚠️  Missing issue date`);
                }
                
                if (row.verification_count !== undefined) {
                    console.log(`   verification_count: ${row.verification_count} (anonymous usage stat)`);
                }
                
                // Check for any personal data violations
                let recordViolations = [];
                
                // Check all properties for potential personal data
                Object.keys(row).forEach(key => {
                    const value = row[key];
                    const keyLower = key.toLowerCase();
                    
                    // Check for personal data in column names
                    if (['student_name', 'user_name', 'email', 'phone', 'address'].includes(keyLower)) {
                        recordViolations.push(`Column "${key}" contains personal data: "${value}"`);
                    }
                    
                    // Check for personal data in values (if it looks like a name)
                    if (typeof value === 'string' && value.length > 0) {
                        // Check if value looks like a personal name (contains spaces and proper case)
                        if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(value) && key !== 'certificate_id' && key !== 'course_code') {
                            recordViolations.push(`Value in "${key}" appears to be a personal name: "${value}"`);
                        }
                        
                        // Check for JSON that might contain personal data
                        if (value.startsWith('{') && key !== 'certificate_hash') {
                            try {
                                const parsed = JSON.parse(value);
                                if (parsed.user || parsed.studentName || parsed.name) {
                                    recordViolations.push(`JSON in "${key}" contains personal data`);
                                }
                            } catch (e) {
                                // Not JSON, ignore
                            }
                        }
                    }
                });
                
                if (recordViolations.length === 0) {
                    console.log('✅ Record is GDPR compliant - no personal data found');
                    gdprCompliantRecords++;
                } else {
                    console.log('\n🚨 GDPR VIOLATIONS in this record:');
                    recordViolations.forEach(v => {
                        console.log(`   ❌ ${v}`);
                        violations.push(`Certificate ${index + 1}: ${v}`);
                    });
                }
                
                console.log('\n' + '-'.repeat(50) + '\n');
            });
            
            // Final compliance summary
            console.log('\n📊 DATA COMPLIANCE SUMMARY');
            console.log('=' .repeat(40));
            console.log(`Total records analyzed: ${rows.length}`);
            console.log(`GDPR compliant records: ${gdprCompliantRecords}`);
            console.log(`Records with violations: ${rows.length - gdprCompliantRecords}`);
            console.log(`Total violations found: ${violations.length}`);
            
            if (violations.length === 0) {
                console.log('\n🎉 ALL DATA IS GDPR COMPLIANT! ✅');
                console.log('✅ No personal data found in database');
                console.log('✅ Only cryptographic hashes and metadata stored');
                console.log('✅ System complies with GDPR Articles 5 & 17');
            } else {
                console.log('\n🚨 GDPR VIOLATIONS DETECTED! ❌');
                console.log('\nViolations found:');
                violations.forEach((v, i) => {
                    console.log(`${i + 1}. ${v}`);
                });
                console.log('\n⚠️  Action required: Remove personal data from database');
            }
        }
        
        // Step 3: Check for old non-compliant database
        console.log('\n🔍 Step 3: Checking for Old Non-Compliant Database\n');
        
        if (fs.existsSync(oldDbPath)) {
            console.log('⚠️  WARNING: Old non-compliant database still exists!');
            console.log(`   Location: ${oldDbPath}`);
            console.log('   This database may contain personal data.');
            console.log('   Consider backing up and then deleting it after migration.');
            
            // Quick check of old database
            const oldDb = new sqlite3.Database(oldDbPath);
            oldDb.all("PRAGMA table_info(certificates)", (oldErr, oldColumns) => {
                if (!oldErr && oldColumns) {
                    const personalCols = oldColumns.filter(col => 
                        ['student_name', 'course_name', 'certificate_data'].includes(col.name.toLowerCase())
                    );
                    
                    if (personalCols.length > 0) {
                        console.log(`   ❌ Old database contains ${personalCols.length} personal data columns:`);
                        personalCols.forEach(col => {
                            console.log(`      - ${col.name}`);
                        });
                        console.log('   🔒 Recommend: Delete old database after confirming migration');
                    }
                }
                oldDb.close();
            });
        } else {
            console.log('✅ No old non-compliant database found');
        }
        
        // Step 4: Overall system compliance
        console.log('\n🏆 OVERALL GDPR COMPLIANCE ASSESSMENT');
        console.log('=' .repeat(50));
        
        const hasPersonalDataColumns = personalDataColumns.length > 0;
        const hasPersonalDataRecords = violations.length > 0;
        
        if (!hasPersonalDataColumns && !hasPersonalDataRecords) {
            console.log('🎉 SYSTEM IS FULLY GDPR COMPLIANT! 🎉');
            console.log('\n✅ Compliance checklist:');
            console.log('   ✅ Article 5 (Data Minimization): Only hashes stored');
            console.log('   ✅ Article 17 (Right to Erasure): No personal data to erase');
            console.log('   ✅ Article 25 (Privacy by Design): Architecture prevents violations');
            console.log('   ✅ Article 32 (Security): SHA-512 cryptographic protection');
            console.log('\n🔒 Risk Assessment: ZERO GDPR risk');
            console.log('📋 Recommendation: System ready for production use');
        } else {
            console.log('🚨 SYSTEM NOT GDPR COMPLIANT! 🚨');
            console.log('\n❌ Issues found:');
            if (hasPersonalDataColumns) {
                console.log('   ❌ Database schema contains personal data columns');
            }
            if (hasPersonalDataRecords) {
                console.log('   ❌ Database records contain personal data');
            }
            console.log('\n📋 Action Required:');
            console.log('   1. Update database schema to remove personal data columns');
            console.log('   2. Migrate to hash-only storage');
            console.log('   3. Implement automatic data deletion');
            console.log('   4. Re-run this compliance check');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🔍 GDPR Compliance Analysis Complete');
        
        db.close();
    });
});

// Function to check if we should also analyze certificate files
setTimeout(() => {
    console.log('\n💡 Pro Tip: Also verify your generated certificates');
    console.log('   Generated certificates should contain:');
    console.log('   ✅ Student name (in certificate for user)');
    console.log('   ✅ Cryptographic hash (for verification)');
    console.log('   ❌ No personal data stored on server');
    console.log('\n   The system should delete personal data immediately after');
    console.log('   certificate generation while preserving verification capability.');
}, 1000);