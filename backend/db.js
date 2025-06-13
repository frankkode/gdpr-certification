// 🗄️ GDPR-Compliant PostgreSQL Database Configuration - VERCEL OPTIMIZED
// ✅ Optimized for Vercel Serverless Functions with connection pooling

const { Pool } = require('pg');
const crypto = require('crypto');

// ✅ VERCEL SERVERLESS OPTIMIZATION: Global connection pool
let globalPool = null;

// ✅ Create connection pool with Vercel-optimized settings
function createPool() {
  if (globalPool) {
    return globalPool;
  }

  console.log('🔄 Creating PostgreSQL connection pool for Vercel...');
  
  globalPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // ✅ VERCEL SERVERLESS OPTIMIZATIONS
    max: 5,                    // Reduced for serverless
    min: 0,                    // Allow zero idle connections
    idleTimeoutMillis: 10000,  // Shorter idle timeout
    connectionTimeoutMillis: 5000,  // Faster connection timeout
    acquireTimeoutMillis: 5000,     // Faster acquire timeout
    
    // ✅ Connection retry settings
    application_name: 'gdpr-cert-vercel',
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  });

  // ✅ Enhanced connection event handlers for Vercel
  globalPool.on('connect', (client) => {
    console.log('✅ PostgreSQL client connected to Railway from Vercel');
  });

  globalPool.on('error', (err, client) => {
    console.error('❌ PostgreSQL pool error on Vercel:', err);
    // Don't exit process in serverless environment
  });

  globalPool.on('acquire', () => {
    console.log('🔗 PostgreSQL connection acquired from pool');
  });

  globalPool.on('release', () => {
    console.log('🔓 PostgreSQL connection released to pool');
  });

  return globalPool;
}

// ✅ Get database connection with error handling
function getPool() {
  try {
    return createPool();
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw error;
  }
}

// ✅ VERCEL-OPTIMIZED: Database connection with retry
async function queryWithRetry(text, params, retries = 3) {
  const pool = getPool();
  
  for (let i = 0; i < retries; i++) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      console.log(`✅ Query executed in ${duration}ms`);
      return result;
      
    } catch (error) {
      console.error(`❌ Query failed (attempt ${i + 1}/${retries}):`, error.message);
      
      // If it's the last retry, throw the error
      if (i === retries - 1) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// ✅ VERCEL-OPTIMIZED: Initialize database tables
async function initializeDatabase() {
  try {
    console.log('🔄 Vercel: Initializing GDPR-compliant PostgreSQL database...');
    
    // ✅ Create certificate_hashes table (NO PERSONAL DATA)
    const createCertificateHashesTable = `
      CREATE TABLE IF NOT EXISTS certificate_hashes (
        id SERIAL PRIMARY KEY,
        certificate_hash CHAR(128) UNIQUE NOT NULL,
        certificate_id VARCHAR(255) UNIQUE NOT NULL,
        course_code VARCHAR(20) NOT NULL,
        issue_date DATE NOT NULL,
        serial_number VARCHAR(255) NOT NULL,
        verification_code VARCHAR(255) NOT NULL,
        digital_signature TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        security_level VARCHAR(50) DEFAULT 'GDPR_COMPLIANT',
        request_id VARCHAR(255) NOT NULL,
        verification_count INTEGER DEFAULT 0,
        last_verified TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT valid_hash CHECK(LENGTH(certificate_hash) = 128),
        CONSTRAINT valid_certificate_id CHECK(certificate_id LIKE 'CERT-%'),
        CONSTRAINT valid_status CHECK(status IN ('ACTIVE', 'REVOKED', 'SUSPENDED'))
      );
    `;

    await queryWithRetry(createCertificateHashesTable);
    console.log('✅ Vercel: certificate_hashes table ready (ZERO personal data)');

    // ✅ Create audit log table
    const createAuditLogTable = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        event_description TEXT NOT NULL,
        certificate_id VARCHAR(255) NULL,
        ip_hash CHAR(64) NULL,
        user_agent_hash CHAR(64) NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        severity VARCHAR(20) DEFAULT 'INFO',
        additional_data JSONB DEFAULT '{}',
        
        CONSTRAINT valid_event_type CHECK(event_type IN (
          'CERTIFICATE_GENERATED', 'CERTIFICATE_VERIFIED', 'VERIFICATION_FAILED', 
          'TAMPER_DETECTED', 'SECURITY_ALERT', 'SYSTEM_ERROR', 'GDPR_COMPLIANCE_CHECK'
        )),
        CONSTRAINT valid_severity CHECK(severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'))
      );
    `;

    await queryWithRetry(createAuditLogTable);
    console.log('✅ Vercel: audit_log table ready');

    // ✅ Create essential indexes
    const indexes = [
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_hash ON certificate_hashes(certificate_hash);",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_id ON certificate_hashes(certificate_id);",
      "CREATE INDEX IF NOT EXISTS idx_status_created ON certificate_hashes(status, created_at);",
      "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);"
    ];

    for (const indexSQL of indexes) {
      try {
        await queryWithRetry(indexSQL);
      } catch (indexError) {
        console.warn('⚠️ Index might already exist:', indexError.message);
      }
    }

    console.log('✅ Vercel: GDPR-compliant database initialization complete');
    
  } catch (error) {
    console.error('❌ Vercel: Database initialization failed:', error);
    throw error;
  }
}

// ✅ VERCEL-OPTIMIZED: Database utilities with connection pooling
const dbUtils = {
  
  // ✅ Log events with Vercel optimization
  logEvent: async (eventType, description, certificateId = null, additionalData = {}, severity = 'INFO', ipAddress = null, userAgent = null) => {
    try {
      const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;
      const userAgentHash = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;
      
      await queryWithRetry(`
        INSERT INTO audit_log 
        (event_type, event_description, certificate_id, ip_hash, user_agent_hash, severity, additional_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [eventType, description, certificateId, ipHash, userAgentHash, severity, JSON.stringify(additionalData)]);
      
    } catch (error) {
      console.error('Error logging event:', error);
    }
  },

  // ✅ Health check optimized for Vercel
  healthCheck: async () => {
    try {
      const startTime = Date.now();
      
      const certResult = await queryWithRetry('SELECT COUNT(*) as count FROM certificate_hashes');
      const auditResult = await queryWithRetry('SELECT COUNT(*) as count FROM audit_log WHERE timestamp >= NOW() - INTERVAL \'24 hours\'');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        platform: 'Vercel Serverless',
        database: 'PostgreSQL on Railway',
        certificateHashCount: parseInt(certResult.rows[0].count),
        auditEventsLast24h: parseInt(auditResult.rows[0].count),
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
        gdprCompliance: {
          personalDataStored: false,
          dataMinimization: 'IMPLEMENTED',
          rightToErasure: 'NOT_APPLICABLE',
          privacyByDesign: 'CORE_ARCHITECTURE'
        }
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        platform: 'Vercel Serverless',
        timestamp: new Date().toISOString()
      };
    }
  },

  // ✅ Get certificate by ID with Vercel optimization
  getCertificateById: async (certificateId) => {
    try {
      const result = await queryWithRetry(`
        SELECT certificate_hash, certificate_id, course_code, issue_date, 
               serial_number, status, security_level, verification_count, 
               last_verified, created_at
        FROM certificate_hashes 
        WHERE certificate_id = $1 AND status = 'ACTIVE'
      `, [certificateId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting certificate by ID:', error);
      throw error;
    }
  }
};

// ✅ VERCEL SERVERLESS: Only initialize on first request, not on import
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

// ✅ Export Vercel-optimized database interface
module.exports = {
  db: {
    query: queryWithRetry,
    ensureInitialized
  },
  dbUtils
};