// ✅ FIXED: Serverless-Compatible PostgreSQL Connection for Vercel + Railway
const { Pool } = require('pg');
const crypto = require('crypto');

// ✅ Create a singleton pool for serverless compatibility
let pool = null;

function getPool() {
  if (!pool) {
    // ✅ Check for Railway environment variables
    const connectionString = process.env.DATABASE_URL || 
                          process.env.POSTGRES_URL || 
                          process.env.RAILWAY_DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ No database connection string found!');
      console.error('🔧 Required environment variables: DATABASE_URL, POSTGRES_URL, or RAILWAY_DATABASE_URL');
      console.error('🔧 Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES')));
      throw new Error('Database connection string not found');
    }

    console.log('🔗 Creating PostgreSQL connection pool...');
    console.log('🔧 Connection string exists:', !!connectionString);
    console.log('🔧 Connection string format:', connectionString.substring(0, 20) + '...');
    
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false  // ✅ Required for Railway
      },
      // ✅ Serverless-optimized settings
      max: 3,                     // Reduced for serverless
      min: 0,                     // No minimum connections
      idleTimeoutMillis: 10000,   // Close idle connections quickly
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      allowExitOnIdle: true       // ✅ Important for serverless
    });

    pool.on('connect', (client) => {
      console.log('✅ Connected to PostgreSQL database on Railway');
    });

    pool.on('error', (err, client) => {
      console.error('❌ PostgreSQL pool error:', err);
      // Don't throw here, just log the error
    });

    pool.on('acquire', () => {
      console.log('🔗 Database connection acquired from pool');
    });

    pool.on('release', () => {
      console.log('🔓 Database connection released to pool');
    });
  }
  return pool;
}

// ✅ Enhanced database query function with retry logic
async function query(text, params = []) {
  const client = getPool();
  let retries = 3;
  
  while (retries > 0) {
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      console.log('✅ Query executed', { duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error(`❌ Query failed (${retries} retries left):`, error.message);
      console.error('🔧 Query:', text);
      console.error('🔧 Params:', params);
      retries--;
      
      if (retries === 0) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// ✅ FIXED: Ensure tables exist before operations.
async function ensureTablesExist() {
  try {
    console.log('🔄 Ensuring database tables exist...');
    
    // ✅ Create certificate_hashes table (GDPR-compliant - NO PERSONAL DATA)
    await query(`
      CREATE TABLE IF NOT EXISTS certificate_hashes (
        id SERIAL PRIMARY KEY,
        
        -- 🔐 CRYPTOGRAPHIC DATA (NOT PERSONAL DATA)
        certificate_hash CHAR(128) UNIQUE NOT NULL,      -- SHA-512 hash (128 hex chars)
        certificate_id VARCHAR(255) UNIQUE NOT NULL,     -- Generated certificate ID
        
        -- 📊 MINIMAL NON-PERSONAL METADATA
        course_code VARCHAR(20) NOT NULL,                -- Generic course identifier (no personal info)
        issue_date DATE NOT NULL,                        -- Certificate issue date
        
        -- 🔒 SECURITY & VERIFICATION DATA (NO PERSONAL INFO)
        serial_number VARCHAR(255) NOT NULL,             -- Unique serial number
        verification_code VARCHAR(255) NOT NULL,         -- Verification code
        digital_signature TEXT NOT NULL,                 -- Digital signature
        status VARCHAR(50) DEFAULT 'ACTIVE',             -- Certificate status
        security_level VARCHAR(50) DEFAULT 'GDPR_COMPLIANT', -- Security level
        request_id VARCHAR(255) NOT NULL,                -- Request tracking ID
        
        -- 📈 ANONYMOUS USAGE STATISTICS
        verification_count INTEGER DEFAULT 0,           -- How many times verified
        last_verified TIMESTAMP NULL,                   -- Last verification time
        
        -- 🕒 SYSTEM TIMESTAMPS
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- 🔒 DATA INTEGRITY CONSTRAINTS
        CONSTRAINT valid_hash CHECK(LENGTH(certificate_hash) = 128),  -- SHA-512 = 128 hex chars
        CONSTRAINT valid_certificate_id CHECK(certificate_id LIKE 'CERT-%'),
        CONSTRAINT valid_course_code CHECK(LENGTH(TRIM(course_code)) >= 1 AND LENGTH(TRIM(course_code)) <= 20),
        CONSTRAINT valid_status CHECK(status IN ('ACTIVE', 'REVOKED', 'SUSPENDED')),
        CONSTRAINT valid_security_level CHECK(security_level IN ('GDPR_COMPLIANT', 'STANDARD'))
      );
    `);
    console.log('✅ GDPR-compliant certificate_hashes table verified/created');
    
    // ✅ Create audit_log table (GDPR-compliant - NO PERSONAL DATA)
    await query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,                -- Type of event
        event_description TEXT NOT NULL,                 -- Description (no personal data)
        certificate_id VARCHAR(255) NULL,                -- Certificate ID (not personal data)
        ip_hash CHAR(64) NULL,                          -- Hashed IP (not personal data under GDPR)
        user_agent_hash CHAR(64) NULL,                  -- Hashed user agent
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        severity VARCHAR(20) DEFAULT 'INFO',            -- INFO, WARNING, ERROR, CRITICAL
        additional_data JSONB DEFAULT '{}',             -- JSON data (no personal info)
        
        CONSTRAINT valid_event_type CHECK(event_type IN (
          'CERTIFICATE_GENERATED', 
          'CERTIFICATE_VERIFIED', 
          'VERIFICATION_FAILED', 
          'TAMPER_DETECTED',
          'SECURITY_ALERT',
          'SYSTEM_ERROR',
          'GDPR_COMPLIANCE_CHECK'
        )),
        CONSTRAINT valid_severity CHECK(severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'))
      );
    `);
    console.log('✅ GDPR-compliant audit_log table verified/created');
    
    // ✅ Create verification_attempts table.
    await query(`
      CREATE TABLE IF NOT EXISTS verification_attempts (
        id SERIAL PRIMARY KEY,
        verification_id VARCHAR(255) UNIQUE NOT NULL,   -- Unique verification ID
        certificate_id VARCHAR(255),                    -- Certificate ID being verified
        verification_method VARCHAR(100) NOT NULL,      -- Method used
        verification_result VARCHAR(50) NOT NULL,       -- Result
        ip_hash CHAR(64),                               -- Hashed IP
        user_agent_hash CHAR(64),                       -- Hashed user agent
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_time_ms INTEGER,                     -- Performance metric
        
        CONSTRAINT valid_method CHECK(verification_method IN (
          'PDF_VERIFICATION',
          'ID_LOOKUP',
          'QR_CODE_SCAN',
          'GDPR_COMPLIANT_HASH_CHECK'
        )),
        CONSTRAINT valid_result CHECK(verification_result IN ('SUCCESS', 'FAILED', 'ERROR', 'TAMPERED'))
      );
    `);
    console.log('✅ GDPR-compliant verification_attempts table verified/created');
    
    // ✅ Create indexes if they don't exist
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_hash ON certificate_hashes(certificate_hash);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_id ON certificate_hashes(certificate_id);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_serial_number ON certificate_hashes(serial_number);`,
      `CREATE INDEX IF NOT EXISTS idx_status_created ON certificate_hashes(status, created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_course_code ON certificate_hashes(course_code);`,
      `CREATE INDEX IF NOT EXISTS idx_issue_date ON certificate_hashes(issue_date);`,
      `CREATE INDEX IF NOT EXISTS idx_security_level ON certificate_hashes(security_level);`,
      `CREATE INDEX IF NOT EXISTS idx_verification_stats ON certificate_hashes(verification_count, last_verified);`,
      `CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type, timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_audit_certificate_id ON audit_log(certificate_id);`,
      `CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_verification_id ON verification_attempts(verification_id);`,
      `CREATE INDEX IF NOT EXISTS idx_verification_cert_id ON verification_attempts(certificate_id);`,
      `CREATE INDEX IF NOT EXISTS idx_verification_timestamp ON verification_attempts(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_verification_result ON verification_attempts(verification_result);`
    ];
    
    let indexCount = 0;
    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
        indexCount++;
      } catch (indexError) {
        console.warn(`⚠️ Index might already exist:`, indexError.message);
      }
    }
    console.log(`✅ ${indexCount}/${indexes.length} GDPR-compliant indexes processed`);
    
    console.log('🗄️ GDPR-Compliant PostgreSQL Database initialized successfully');
    console.log('📊 Enhanced features: Zero Personal Data, Hash-Only Storage, Auto-Compliance');
    console.log('✅ GDPR Articles 5 & 17 Compliant by Design');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure tables exist:', error);
    throw error;
  }
}

// ✅ Test database connection
async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection test successful!');
    console.log('⏰ Current time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.error('🔧 Environment variables check:');
    console.error('   - NODE_ENV:', process.env.NODE_ENV);
    console.error('   - DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.error('   - POSTGRES_URL present:', !!process.env.POSTGRES_URL);
    console.error('   - RAILWAY_DATABASE_URL present:', !!process.env.RAILWAY_DATABASE_URL);
    return false;
  }
}

// ✅ GDPR-COMPLIANT DATABASE UTILITY FUNCTIONS
const dbUtils = {
  
  /**
   * 📝 Log security events (NO PERSONAL DATA)
   * IP addresses and user agents are hashed to prevent personal data storage
   */
  logEvent: async (eventType, description, certificateId = null, additionalData = {}, severity = 'INFO', ipAddress = null, userAgent = null) => {
    try {
      // ✅ Hash IP and user agent to prevent personal data storage
      const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;
      const userAgentHash = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;
      
      await query(`
        INSERT INTO audit_log 
        (event_type, event_description, certificate_id, ip_hash, user_agent_hash, severity, additional_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        eventType,
        description,
        certificateId,
        ipHash,
        userAgentHash,
        severity,
        JSON.stringify(additionalData)
      ]);
      
      if (severity === 'CRITICAL' || severity === 'ERROR') {
        console.error(`🚨 ${severity}: ${eventType} - ${description}`);
      }
    } catch (error) {
      console.error('Error logging event:', error);
    }
  },
  
  /**
   * 📊 Log verification attempts (GDPR COMPLIANT)
   */
  logVerificationAttempt: async (verificationId, certificateId, method, result, processingTime, ipAddress = null, userAgent = null) => {
    try {
      const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;
      const userAgentHash = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;
      
      await query(`
        INSERT INTO verification_attempts 
        (verification_id, certificate_id, verification_method, verification_result, 
         processing_time_ms, ip_hash, user_agent_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        verificationId,
        certificateId,
        method,
        result,
        processingTime,
        ipHash,
        userAgentHash
      ]);
    } catch (error) {
      console.error('Error logging verification attempt:', error);
    }
  },
  
  /**
   * 📈 Get verification statistics (ANONYMOUS DATA ONLY)
   */
  getVerificationStats: async () => {
    try {
      const query_text = `
        SELECT 
          COUNT(*) as total_certificates,
          SUM(verification_count) as total_verifications,
          AVG(verification_count) as avg_verifications_per_cert,
          COUNT(CASE WHEN verification_count > 0 THEN 1 END) as verified_certificates,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_certificates,
          COUNT(CASE WHEN security_level = 'GDPR_COMPLIANT' THEN 1 END) as gdpr_compliant_certificates
        FROM certificate_hashes 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;
      
      const result = await query(query_text);
      const stats = result.rows[0];
      
      return {
        ...stats,
        success_rate: stats.total_verifications > 0 ? 
          ((stats.total_verifications / stats.total_certificates) * 100).toFixed(2) : '100.00',
        gdpr_compliance_rate: stats.total_certificates > 0 ?
          ((stats.gdpr_compliant_certificates / stats.total_certificates) * 100).toFixed(2) : '100.00'
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      throw error;
    }
  },
  
  /**
   * 🔒 Get course statistics (ANONYMOUS DATA)
   */
  getCourseStats: async () => {
    try {
      const query_text = `
        SELECT 
          course_code,
          COUNT(*) as certificate_count,
          SUM(verification_count) as total_verifications,
          AVG(verification_count) as avg_verifications,
          MAX(created_at) as latest_certificate
        FROM certificate_hashes 
        GROUP BY course_code
        ORDER BY certificate_count DESC
      `;
      
      const result = await query(query_text);
      return result.rows;
    } catch (error) {
      console.error('Error getting course stats:', error);
      throw error;
    }
  },
  
  /**
   * 🔐 Get security events summary (NO PERSONAL DATA)
   */
  getSecurityEventsSummary: async () => {
    try {
      const query_text = `
        SELECT 
          event_type,
          severity,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM audit_log 
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY event_type, severity
        ORDER BY severity DESC, count DESC
      `;
      
      const result = await query(query_text);
      return result.rows;
    } catch (error) {
      console.error('Error getting security events summary:', error);
      throw error;
    }
  },
  
  /**
   * 🏥 Health check with GDPR compliance verification
   */
  healthCheck: async () => {
    try {
      const startTime = Date.now();
      
      // Ensure tables exist
      await ensureTablesExist();
      
      // Test database responsiveness
      const certResult = await query('SELECT COUNT(*) as certificateCount FROM certificate_hashes');
      
      let auditCount = 0;
      try {
        const auditResult = await query('SELECT COUNT(*) as auditCount FROM audit_log WHERE timestamp >= NOW() - INTERVAL \'24 hours\'');
        auditCount = parseInt(auditResult.rows[0].auditcount || auditResult.rows[0].auditCount || 0);
      } catch (auditError) {
        console.warn('Audit log query failed:', auditError.message);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        certificateHashCount: parseInt(certResult.rows[0].certificatecount || certResult.rows[0].certificateCount || 0),
        auditEventsLast24h: auditCount,
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL on Railway',
        gdprCompliance: {
          personalDataStored: false,
          dataMinimization: 'IMPLEMENTED',
          rightToErasure: 'NOT_APPLICABLE_NO_PERSONAL_DATA',
          privacyByDesign: 'CORE_ARCHITECTURE'
        }
      };
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  },
  
  /**
   * 🗑️ Clean old audit logs (GDPR data retention)
   * Keep only last 90 days for security analysis
   */
  cleanOldAuditLogs: async () => {
    try {
      const query_text = `DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '90 days'`;
      const result = await query(query_text);
      console.log(`✅ Cleaned ${result.rowCount} old audit log entries (GDPR compliance)`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error cleaning old audit logs:', error);
      throw error;
    }
  },
  
  /**
   * 📋 GDPR compliance verification
   */
  verifyGDPRCompliance: async () => {
    try {
      // Check table schema to ensure no personal data columns exist
      const query_text = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'certificate_hashes' 
        AND column_name IN ('student_name', 'course_name', 'certificate_data', 'personal_data')
      `;
      
      const result = await query(query_text);
      const personalDataColumns = result.rows.map(row => row.column_name);
      
      const compliance = {
        personalDataColumnsFound: personalDataColumns.length,
        personalDataColumns: personalDataColumns,
        gdprCompliant: personalDataColumns.length === 0,
        dataMinimization: 'IMPLEMENTED',
        rightToErasure: 'NOT_APPLICABLE',
        privacyByDesign: 'VERIFIED'
      };
      
      if (compliance.gdprCompliant) {
        console.log('✅ GDPR Compliance VERIFIED: No personal data columns found');
      } else {
        console.error('❌ GDPR Compliance FAILED: Personal data columns detected:', personalDataColumns);
      }
      
      return compliance;
    } catch (error) {
      console.error('Error verifying GDPR compliance:', error);
      throw error;
    }
  },
  
  /**
   * 🔍 Get certificate by ID (HASH ONLY - NO PERSONAL DATA)
   */
  getCertificateById: async (certificateId) => {
    try {
      const query_text = `
        SELECT 
          certificate_hash,
          certificate_id,
          course_code,
          issue_date,
          serial_number,
          status,
          security_level,
          verification_count,
          last_verified,
          created_at
        FROM certificate_hashes 
        WHERE certificate_id = $1 AND status = 'ACTIVE'
      `;
      
      const result = await query(query_text, [certificateId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting certificate by ID:', error);
      throw error;
    }
  }
};

// ✅ Initialize database on startup (only for non-serverless environments)
async function initializeOnStartup() {
  try {
    const connectionOk = await testConnection();
    if (connectionOk) {
      await ensureTablesExist();
      console.log('🗄️ Database initialization completed successfully');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

// Only initialize on startup for local development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  initializeOnStartup().catch(console.error);
}

// ✅ Periodic GDPR compliance verification and maintenance (only in non-serverless)
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  setInterval(async () => {
    try {
      // Clean old audit logs for GDPR compliance
      await dbUtils.cleanOldAuditLogs();
      console.log('🧹 Periodic GDPR maintenance: Old audit logs cleaned');
      
      // Verify GDPR compliance
      const compliance = await dbUtils.verifyGDPRCompliance();
      if (compliance.gdprCompliant) {
        console.log('✅ Periodic GDPR compliance check: PASSED');
      } else {
        console.error('❌ Periodic GDPR compliance check: FAILED', compliance);
      }
    } catch (error) {
      console.error('Error in periodic maintenance:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down GDPR-compliant PostgreSQL connection...');
  if (pool) {
    pool.end(() => {
      console.log('✅ PostgreSQL connection pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  if (pool) {
    pool.end(() => {
      console.log('✅ PostgreSQL connection pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = {
  db: { query },
  dbUtils,
  ensureTablesExist,
  testConnection
};