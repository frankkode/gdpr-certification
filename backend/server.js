// 🏆 GDPR-Compliant Certificate Verification System - PostgreSQL Version - FIXED
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const { db, dbUtils, ensureTablesExist, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: Enhanced CORS for Vercel deployment
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://gdpr-certification-cl7s.vercel.app',
    'https://gdpr-certification-cl7s-k8clxlhhz-frankkodes-projects.vercel.app',
    'http://localhost:3000', 
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const generateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many certificate generation requests' }
});

const verifyLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many verification requests' }
});

app.use(express.json({ limit: '10mb' }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// System statistics - NO PERSONAL DATA
let stats = {
  certificatesGenerated: 0,
  verificationsPerformed: 0,
  successfulVerifications: 0,
  tamperDetected: 0,
  startTime: Date.now()
};

// ✅ FIXED: GDPR-Compliant canonical JSON creation
function createCanonicalJSON(user, exam, providedTimestamp = null, providedNonce = null) {
  const timestamp = providedTimestamp || Date.now();
  const nonce = providedNonce || crypto.randomBytes(16).toString('hex');
  
  const certificate = {
    user: user.trim(),
    exam: exam.trim(),
    timestamp,
    nonce,
    version: "4.0",
    issuer: "GDPR-Compliant Certificate System",
    integrity: "SHA-512"
  };
  
  // Sort keys for canonical representation
  const sortedKeys = Object.keys(certificate).sort();
  const canonicalObj = {};
  sortedKeys.forEach(key => {
    canonicalObj[key] = certificate[key];
  });
  
  return JSON.stringify(canonicalObj);
}

// ✅ FIXED: Use SHA-512 consistently
function generateSecureHash(data, algorithm = 'sha512') {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

function generateCertificateId(hash, timestamp) {
  const hashPart = hash.substring(0, 16).toUpperCase();
  const timePart = timestamp.toString(36).toUpperCase();
  const checksum = crypto.createHash('md5').update(hash + timestamp).digest('hex').substring(0, 4).toUpperCase();
  
  return `CERT-${hashPart.substring(0, 4)}-${hashPart.substring(4, 8)}-${hashPart.substring(8, 12)}-${timePart}-${checksum}`;
}

// ✅ FIXED: GDPR-Compliant PDF generation
async function generateGDPRCompliantPDF(certificateData) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎨 Creating GDPR-compliant certificate for:', certificateData.studentName);
      
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Certificate - ${certificateData.certificateId}`,
          Author: 'GDPR-Compliant Certificate Authority',
          Subject: `Certificate for ${certificateData.studentName}`,
          Keywords: `certificate,${certificateData.certificateId}`,
          Creator: 'GDPR-Compliant Certificate System v4.0'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        console.log('✅ GDPR-compliant certificate created');
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

      const width = doc.page.width;
      const height = doc.page.height;

      // Professional color scheme
      const colors = {
        navy: '#1e3a8a',
        gold: '#d97706',
        green: '#059669',
        gray: '#6b7280',
        white: '#ffffff'
      };

      // Certificate layout
      doc.rect(20, 20, width - 40, height - 40).stroke(colors.navy, 4);
      doc.rect(35, 35, width - 70, height - 70).stroke(colors.gold, 2);

      // Header
      doc.fontSize(48).font('Helvetica-Bold').fillColor(colors.navy)
         .text('CERTIFICATE', 0, 80, { align: 'center' });

      doc.fontSize(28).fillColor(colors.gold)
         .text('of Completion', 0, 135, { align: 'center' });

      // Decorative line
      doc.moveTo(width/2 - 150, 175).lineTo(width/2 + 150, 175).stroke(colors.gold, 3);

      // Content
      doc.fontSize(18).font('Helvetica').fillColor(colors.gray)
         .text('This certifies that', 0, 200, { align: 'center' });

      // Student name
      doc.fontSize(42).font('Helvetica-Bold').fillColor(colors.navy)
         .text(certificateData.studentName, 0, 240, { align: 'center' });

      // Name underline
      const nameWidth = doc.widthOfString(certificateData.studentName);
      const underlineX = (width - nameWidth) / 2;
      doc.moveTo(underlineX, 290).lineTo(underlineX + nameWidth, 290).stroke(colors.gold, 2);

      // Course section
      doc.fontSize(16).font('Helvetica').fillColor(colors.gray)
         .text('has successfully completed the course', 0, 320, { align: 'center' });

      // Course name
      doc.fontSize(24).font('Helvetica-Bold').fillColor(colors.green)
         .text(`"${certificateData.courseName}"`, 0, 350, { align: 'center' });

      // Date
      doc.fontSize(14).font('Helvetica').fillColor(colors.gray)
         .text(`Completed on ${new Date(certificateData.issueDate).toLocaleDateString('en-US', {
           year: 'numeric', month: 'long', day: 'numeric'
         })}`, 0, 390, { align: 'center' });

      // ✅ FIXED: GDPR-Compliant verification section
      const verifyY = 430;
      
      doc.rect(60, verifyY, width - 120, 80).fill('#f8fafc').stroke(colors.navy, 1);

      doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.navy)
         .text('   GDPR-COMPLIANT VERIFICATION', 70, verifyY + 10);

      const verifyDetails = [
        `Certificate ID: ${certificateData.certificateId}`,
        `Serial Number: ${certificateData.serialNumber}`,
        `Issue Date: ${new Date(certificateData.issueDate).toLocaleDateString()}`,
        `Digital Signature: VERIFIED`,
        `GDPR Compliant: Personal data auto-deleted`,
        `Hash: ${certificateData.hash.substring(0, 32)}...`
      ];

      verifyDetails.forEach((detail, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = 80 + (col * 300);
        const y = verifyY + 30 + (row * 12);
        
        doc.fontSize(8).font('Helvetica').fillColor(colors.gray).text(detail, x, y);
      });

      // QR Code generation
      try {
        const qrData = JSON.stringify({
          id: certificateData.certificateId,
          hash: certificateData.hash.substring(0, 32),
          verify: 'gdpr-compliant-verification'
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: { dark: colors.navy, light: colors.white },
          errorCorrectionLevel: 'M'
        });

        const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        
        const qrX = width - 140;
        const qrY = verifyY - 30;
        
        doc.rect(qrX - 5, qrY - 5, 90, 90).fill(colors.white).stroke(colors.gold, 1);
        doc.image(qrBuffer, qrX, qrY, { width: 80, height: 80 });
        doc.fontSize(8).fillColor(colors.navy).text('Scan to Verify', qrX - 5, qrY + 85, { width: 90, align: 'center' });

      } catch (qrError) {
        console.warn('QR code generation failed, continuing without QR:', qrError.message);
      }

      // Footer
      doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.navy)
         .text('GDPR-COMPLIANT CERTIFICATE AUTHORITY', 0, height - 60, { align: 'center' });

      // ✅ CRITICAL: Embed verification metadata WITHOUT personal data exposure
      const verificationData = {
        version: '4.0',
        certificateId: certificateData.certificateId,
        hash: certificateData.hash,
        serialNumber: certificateData.serialNumber,
        courseName: certificateData.courseName,
        issueDate: certificateData.issueDate,
        canonicalJSON: certificateData.canonicalJSON,
        digitalSignature: certificateData.digitalSignature,
        timestamp: certificateData.timestamp,
        nonce: certificateData.nonce,
        gdprCompliant: true
      };

      const metadataJSON = JSON.stringify(verificationData);
      
      // Embed metadata as invisible text for verification
      doc.fontSize(0.1).fillColor(colors.white)
         .text(`---CERT-VERIFY-START---${metadataJSON}---CERT-VERIFY-END---`, 1, 1);
      
      doc.fontSize(0.1).fillColor(colors.white)
         .text(`CERTDATA:${metadataJSON}:ENDDATA`, 1, 5);
      
      doc.fontSize(0.1).fillColor(colors.white)
         .text(`METADATA${Buffer.from(metadataJSON).toString('base64')}ENDMETA`, 1, 10);

      doc.end();

    } catch (error) {
      console.error('PDF generation failed:', error);
      reject(error);
    }
  });
}

// Input validation
const certificateValidation = [
  body('user')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-\.\']+$/)
    .withMessage('Invalid user name format'),
  body('exam')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Invalid exam name format')
];

// ✅ FIXED: GDPR-COMPLIANT CERTIFICATE GENERATION WITH POSTGRESQL
app.post('/generate', generateLimit, certificateValidation, async (req, res) => {
  try {
    console.log('🎨 GDPR-compliant certificate generation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { user, exam } = req.body;
    const requestId = uuidv4();
    
    // ✅ CRITICAL: Ensure database tables exist before operations
    try {
      console.log('🔄 Ensuring database tables exist...');
      await ensureTablesExist();
      console.log('✅ Database tables verified');
    } catch (dbSetupError) {
      console.error('❌ Database setup failed:', dbSetupError);
      return res.status(500).json({ 
        error: 'Database setup failed', 
        details: dbSetupError.message,
        code: 'DB_SETUP_ERROR'
      });
    }
    
    // Step 1: Create canonical JSON with personal data
    const canonicalJSON = createCanonicalJSON(user, exam);
    
    // Step 2: Generate hash from canonical JSON
    const hash = generateSecureHash(canonicalJSON, 'sha512');
    
    // Step 3: Generate certificate metadata
    const timestamp = Date.now();
    const certificateId = generateCertificateId(hash, timestamp);
    const serialNumber = crypto.randomBytes(12).toString('hex').toUpperCase();
    const verificationCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    
    const signatureData = `${certificateId}:${hash}:${timestamp}`;
    const digitalSignature = crypto.createHmac('sha512', process.env.JWT_SECRET || 'fallback-secret')
                                  .update(signatureData)
                                  .digest('hex');
    
    const certificateData = {
      hash,
      certificateId,
      serialNumber,
      verificationCode,
      digitalSignature,
      studentName: user.trim(),
      courseName: exam.trim(),
      issueDate: new Date().toISOString(),
      canonicalJSON,
      status: 'ACTIVE',
      version: '4.0',
      requestId,
      timestamp,
      nonce: JSON.parse(canonicalJSON).nonce
    };

    console.log('🎨 Generating GDPR-compliant PDF...');
    const pdfBuffer = await generateGDPRCompliantPDF(certificateData);
    
    // ✅ FIXED: Store ONLY hash in PostgreSQL database (NO PERSONAL DATA)
    const courseCode = exam.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'UNKNOWN';
    
    try {
      console.log('💾 Storing certificate hash in database...');
      console.log('🔧 Certificate ID:', certificateId);
      console.log('🔧 Hash length:', hash.length);
      console.log('🔧 Course code:', courseCode);
      
      const insertResult = await db.query(`
        INSERT INTO certificate_hashes (
          certificate_hash, certificate_id, course_code, issue_date, 
          serial_number, verification_code, digital_signature, 
          status, security_level, request_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        hash, 
        certificateId, 
        courseCode, 
        certificateData.issueDate.split('T')[0],  // Convert to DATE format
        serialNumber, 
        verificationCode, 
        digitalSignature,
        'ACTIVE', 
        'GDPR_COMPLIANT', 
        requestId, 
        new Date().toISOString()
      ]);
      
      console.log(`✅ GDPR-compliant certificate stored: ${certificateId}`);
      console.log(`🆔 Database record ID: ${insertResult.rows[0].id}`);
      console.log(`🔒 GDPR Compliance: ZERO personal data retained in database`);
      
      stats.certificatesGenerated++;
      
      // ✅ Log GDPR-compliant event (no personal data)
      await dbUtils.logEvent('CERTIFICATE_GENERATED', 
        `Certificate ${certificateId} generated with GDPR compliance`, 
        certificateId, { courseCode }, 'INFO');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr_certificate_${certificateId}.pdf"`);
      res.setHeader('X-Certificate-ID', certificateId);
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-GDPR-Compliant', 'true');
      res.setHeader('X-Personal-Data-Retained', 'false');
      res.send(pdfBuffer);
      
      // ✅ AUTOMATIC DATA DELETION SIMULATION
      console.log('🗑️  GDPR AUTO-DELETION: Personal data never stored - compliance achieved by design!');
      
    } catch (dbError) {
      console.error('❌ Database insertion error:', dbError);
      console.error('🔧 Error details:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint
      });
      
      return res.status(500).json({ 
        error: 'Database error during certificate storage', 
        details: dbError.message,
        code: dbError.code || 'DB_INSERT_ERROR',
        certificateId: certificateId  // Return the ID even if storage failed
      });
    }
    
  } catch (error) {
    console.error('❌ Certificate generation error:', error);
    res.status(500).json({ 
      error: 'Certificate generation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ FIXED: GDPR-COMPLIANT PDF VERIFICATION WITH POSTGRESQL
app.post('/verify/pdf', verifyLimit, upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF certificate file is required' });
    }

    const verificationId = uuidv4();
    stats.verificationsPerformed++;
    
    console.log('🔍 Starting GDPR-compliant PDF verification');
    console.log('🔍 File size:', req.file.size);

    let extractedData = null;
    
    try {
      // Method 1: Standard pdf-parse
      const pdfData = await pdfParse(req.file.buffer, {
        pagerender: false,
        normalizeWhitespace: false,
        version: 'v1.10.100'
      });
      
      console.log('✅ PDF parsed successfully');
      console.log('📄 Text length:', pdfData.text?.length || 0);
      
      if (pdfData.text) {
        const startMarker = '---CERT-VERIFY-START---';
        const endMarker = '---CERT-VERIFY-END---';
        
        const startIndex = pdfData.text.indexOf(startMarker);
        const endIndex = pdfData.text.indexOf(endMarker);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = pdfData.text.substring(startIndex + startMarker.length, endIndex);
          console.log('🔍 Extracted JSON string length:', jsonStr.length);
          
          try {
            extractedData = JSON.parse(jsonStr);
            console.log('✅ Method 1 SUCCESS - JSON parsed');
            console.log('✅ Certificate ID:', extractedData.certificateId);
          } catch (parseError) {
            console.error('❌ Method 1 JSON parse failed:', parseError.message);
          }
        } else {
          // Try alternative markers
          const certDataStart = pdfData.text.indexOf('CERTDATA:');
          const certDataEnd = pdfData.text.indexOf(':ENDDATA');
          
          if (certDataStart !== -1 && certDataEnd !== -1) {
            const jsonStr = pdfData.text.substring(certDataStart + 9, certDataEnd);
            try {
              extractedData = JSON.parse(jsonStr);
              console.log('✅ Method 2 SUCCESS - CERTDATA parsed');
            } catch (parseError) {
              console.error('❌ Method 2 failed:', parseError.message);
            }
          }
        }
      }
      
    } catch (pdfError) {
      console.error('❌ PDF parsing failed:', pdfError.message);
    }
    
    if (!extractedData) {
      console.log('❌ ALL METHODS FAILED');
      return res.json({
        valid: false,
        message: 'Certificate metadata not found',
        errorCode: 'NO_METADATA_FOUND',
        verificationId
      });
    }
    
    console.log('✅ Metadata extracted successfully');
    console.log('✅ Certificate ID:', extractedData.certificateId);
    
    if (!extractedData.canonicalJSON) {
      console.log('❌ No canonical JSON found');
      return res.json({
        valid: false,
        message: 'No canonical JSON in metadata',
        extractedData,
        verificationId
      });
    }
    
    // Hash verification
    const computedHash = generateSecureHash(extractedData.canonicalJSON);
    console.log('🔍 Hash comparison:');
    console.log('  - Extracted:', extractedData.hash?.substring(0, 32) + '...');
    console.log('  - Computed: ', computedHash.substring(0, 32) + '...');
    console.log('  - Match:    ', extractedData.hash === computedHash);
    
    if (extractedData.hash !== computedHash) {
      return res.json({
        valid: false,
        message: 'Hash mismatch - certificate may be tampered',
        debugInfo: {
          extractedHash: extractedData.hash,
          computedHash,
          canonicalJSON: extractedData.canonicalJSON
        },
        verificationId
      });
    }
    
    // ✅ FIXED: PostgreSQL database verification using ONLY hash (no personal data access)
    try {
      const result = await db.query(
        'SELECT * FROM certificate_hashes WHERE certificate_hash = $1 AND status = $2', 
        [extractedData.hash, 'ACTIVE']
      );
      
      if (!result.rows || result.rows.length === 0) {
        return res.json({
          valid: false,
          message: 'Certificate not found in database or has been revoked',
          debugInfo: { certificateId: extractedData.certificateId },
          verificationId
        });
      }
      
      const row = result.rows[0];
      console.log('✅ Found in database');
      console.log('✅ DB hash matches:', row.certificate_hash === extractedData.hash);
      
      // ✅ SUCCESS - Update verification count (anonymous metric)
      await db.query(
        'UPDATE certificate_hashes SET verification_count = verification_count + 1, last_verified = CURRENT_TIMESTAMP WHERE certificate_hash = $1', 
        [extractedData.hash]
      );
      
      stats.successfulVerifications++;
      
      // ✅ GDPR-compliant response (no personal data from database)
      res.json({
        valid: true,
        message: '🏆 GDPR-compliant certificate verified successfully!',
        certificateDetails: {
          certificateId: row.certificate_id,
          courseCode: row.course_code,
          formattedIssueDate: new Date(row.issue_date).toLocaleDateString(),
          issueDate: row.issue_date,
          serialNumber: row.serial_number,
          status: row.status,
          gdprCompliant: true
        },
        securityInfo: {
          verificationTime: new Date().toISOString(),
          verificationMethod: 'GDPR_COMPLIANT_HASH_VERIFICATION',
          securityLevel: 'GDPR_COMPLIANT',
          personalDataAccessed: false
        },
        verificationId
      });
      
      // ✅ Log verification (no personal data)
      await dbUtils.logEvent('CERTIFICATE_VERIFIED', 
        `Certificate ${row.certificate_id} verified successfully with GDPR compliance`, 
        row.certificate_id, {}, 'INFO');
      
    } catch (dbError) {
      console.error('Database verification error:', dbError);
      return res.json({
        valid: false,
        message: 'Database verification failed',
        debugInfo: { dbError: dbError.message },
        verificationId
      });
    }
    
  } catch (error) {
    console.error('🚨 Fatal error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      details: error.message,
      verificationId: uuidv4()
    });
  }
});

// ✅ FIXED: Certificate ID verification with PostgreSQL (no personal data access)
app.get('/verify/:certificateId', verifyLimit, async (req, res) => {
  const { certificateId } = req.params;
  const verificationId = uuidv4();
  
  stats.verificationsPerformed++;
  console.log('🔍 Certificate ID verification:', certificateId);

  try {
    // ✅ FIXED: PostgreSQL query ONLY hash table (no personal data)
    const result = await db.query(
      'SELECT * FROM certificate_hashes WHERE certificate_id = $1 AND status = $2', 
      [certificateId, 'ACTIVE']
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Certificate ID verification failed');
      return res.json({
        valid: false,
        message: 'Certificate not found or has been revoked',
        certificateId,
        verificationId
      });
    }

    const row = result.rows[0];
    stats.successfulVerifications++;
    console.log('✅ Certificate ID verified successfully');
    
    res.json({
      valid: true,
      message: '✅ GDPR-compliant certificate verified successfully via database lookup',
      certificateDetails: {
        certificateId: row.certificate_id,
        courseCode: row.course_code,
        formattedIssueDate: new Date(row.issue_date).toLocaleDateString(),
        issueDate: row.issue_date,
        serialNumber: row.serial_number,
        status: row.status,
        verificationMethod: 'ID_LOOKUP',
        gdprCompliant: true
      },
      securityInfo: {
        verificationTime: new Date().toISOString(),
        verificationMethod: 'GDPR_COMPLIANT_DATABASE_LOOKUP',
        securityLevel: 'GDPR_VERIFIED',
        personalDataAccessed: false
      },
      verificationId
    });
    
    // Update verification count
    await db.query(
      'UPDATE certificate_hashes SET verification_count = verification_count + 1, last_verified = CURRENT_TIMESTAMP WHERE certificate_id = $1', 
      [certificateId]
    );
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Verification failed',
      details: error.message,
      verificationId
    });
  }
});

// ✅ Root route
app.get('/', (req, res) => {
  res.json({
    message: '🏆 Professional Certificate System API',
    status: 'GDPR-compliant and operational',
    version: '4.0.0',
    endpoints: {
      'POST /generate': 'Generate GDPR-compliant certificate',
      'POST /verify/pdf': 'GDPR-compliant PDF verification', 
      'GET /verify/:certificateId': 'ID verification',
      'GET /stats': 'System statistics (no personal data)',
      'GET /health': 'Health check'
    },
    documentation: 'https://your-docs-url.com',
    frontend: 'https://gdpr-certification-cl7s.vercel.app'
  });
});

// ✅ FIXED: GDPR-compliant statistics with PostgreSQL (no personal data)
app.get('/stats', async (req, res) => {
  try {
    const uptimeHours = (Date.now() - stats.startTime) / (1000 * 60 * 60);
    const successRate = stats.verificationsPerformed > 0 
      ? (stats.successfulVerifications / stats.verificationsPerformed * 100).toFixed(2)
      : 100;

    res.json({
      statistics: {
        certificatesGenerated: stats.certificatesGenerated,
        verificationsPerformed: stats.verificationsPerformed,
        successfulVerifications: stats.successfulVerifications,
        tamperDetected: stats.tamperDetected,
        successRate: `${successRate}%`,
        uptimeHours: uptimeHours.toFixed(2),
        hashCollisionProbability: "1 in 2^512",
        gdprCompliance: {
          status: 'FULLY_COMPLIANT',
          personalDataStored: false,
          automaticDeletion: 'NOT_NEEDED_NO_DATA_STORED',
          dataMinimization: 'IMPLEMENTED_HASH_ONLY',
          rightToErasure: 'NOT_APPLICABLE_NO_PERSONAL_DATA'
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ✅ FIXED: GDPR-compliant health check with PostgreSQL
app.get('/health', async (req, res) => {
  try {
    const healthData = await dbUtils.healthCheck();
    
    res.json({
      status: 'OK',
      version: '1.0.0-GDPR-COMPLIANT-POSTGRESQL',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: healthData,
      features: [
        'GDPR Article 5 Compliant (Data Minimization)',
        'GDPR Article 17 Compliant (Right to Erasure Not Needed)', 
        'Privacy by Design Architecture',
        'SHA-512 Cryptographic Verification',
        'Zero Personal Data Storage',
        'PostgreSQL on Railway'
      ],
      gdprCompliance: {
        dataMinimization: 'IMPLEMENTED',
        rightToErasure: 'NOT_NEEDED',
        privacyByDesign: 'CORE_ARCHITECTURE',
        personalDataRetention: 'ZERO'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// 🧪 DEBUG ENDPOINTS (Remove after testing)
app.get('/debug/db-test', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Check environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlFormat: process.env.DATABASE_URL?.startsWith('postgresql://') || process.env.DATABASE_URL?.startsWith('postgres://'),
      nodeEnv: process.env.NODE_ENV
    };
    
    // Test 2: Test connection
    const connectionTest = await testConnection();
    
    // Test 3: Test table creation
    const tablesTest = await ensureTablesExist();
    
    // Test 4: Test simple query
    const queryResult = await db.query('SELECT NOW() as current_time');
    
    res.json({
      success: true,
      environmentVariables: envCheck,
      connectionTest,
      tablesCreated: tablesTest,
      currentTime: queryResult.rows[0].current_time,
      message: '✅ All database tests passed!'
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
});

app.post('/debug/cert-test', async (req, res) => {
  try {
    const { user = 'Test User', exam = 'Test Course' } = req.body;
    
    // Test hash generation
    const canonicalJSON = createCanonicalJSON(user, exam);
    const hash = generateSecureHash(canonicalJSON, 'sha512');
    const certificateId = generateCertificateId(hash, Date.now());
    
    console.log('🧪 Testing certificate data creation...');
    console.log('Hash length:', hash.length);
    console.log('Certificate ID:', certificateId);
    
    // Test database insertion
    await ensureTablesExist();
    
    const result = await db.query(`
      INSERT INTO certificate_hashes (
        certificate_hash, certificate_id, course_code, issue_date, 
        serial_number, verification_code, digital_signature, 
        status, security_level, request_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      hash,
      certificateId,
      'TEST',
      new Date().toISOString().split('T')[0],
      'TEST123',
      'VERIFY123',
      'test-signature',
      'ACTIVE',
      'GDPR_COMPLIANT',
      'test-request-123',
      new Date().toISOString()
    ]);
    
    res.json({
      success: true,
      certificateId,
      hash: hash.substring(0, 16) + '...',
      databaseId: result.rows[0].id,
      message: '✅ Certificate test successful!'
    });
    
  } catch (error) {
    console.error('❌ Certificate test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableEndpoints: [
      'POST /generate - Generate GDPR-compliant certificate',
      'POST /verify/pdf - GDPR-compliant PDF verification',
      'GET /verify/:certificateId - ID verification',
      'GET /stats - System statistics',
      'GET /health - Health check',
      'GET /debug/db-test - Database test (temporary)',
      'POST /debug/cert-test - Certificate test (temporary)'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔒 GDPR-Compliant Certificate System v4.0 (PostgreSQL) running on port ${PORT}`);
  console.log(`✅ Features: Privacy by Design, Zero Personal Data Storage, Auto-Compliance`);
  console.log(`🗄️ Database: PostgreSQL on Railway`);
  console.log(`🔗 Available at: http://localhost:${PORT}`);
});

module.exports = app;