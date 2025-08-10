const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if session exists and is active
    const sessionResult = await db.query(
      'SELECT s.*, u.email, u.role, u.is_active FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = $1 AND s.is_active = true AND s.expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      });
    }

    const session = sessionResult.rows[0];
    
    // Check if user is still active
    if (!session.is_active) {
      return res.status(401).json({ 
        error: 'User account is deactivated',
        code: 'USER_DEACTIVATED' 
      });
    }

    // Add user info to request
    req.user = {
      id: session.user_id,
      email: session.email,
      role: session.role,
      sessionId: session.id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }

    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
};

// Authorization middleware - check user role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        code: 'NOT_AUTHENTICATED' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Create user session
const createSession = async (userId, token, ipAddress = null, userAgent = null) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    // Hash IP and user agent for privacy
    const ipHash = ipAddress ? crypto.createHash('sha256').update(ipAddress).digest('hex') : null;
    const userAgentHash = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;

    const result = await db.query(
      'INSERT INTO user_sessions (user_id, session_token, expires_at, ip_hash, user_agent_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, token, expiresAt, ipHash, userAgentHash]
    );

    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Invalidate user session
const invalidateSession = async (token) => {
  try {
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE session_token = $1',
      [token]
    );
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw error;
  }
};

// Clean expired sessions
const cleanExpiredSessions = async () => {
  try {
    const result = await db.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = false'
    );
    console.log(`Cleaned ${result.rowCount} expired sessions`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning expired sessions:', error);
    throw error;
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Create new user
const createUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, role = 'user', gdprConsent = false } = userData;
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Set data retention expiry (3 years from now as per GDPR)
    const dataRetentionExpires = new Date();
    dataRetentionExpires.setFullYear(dataRetentionExpires.getFullYear() + 3);
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, gdpr_consent, gdpr_consent_date, data_retention_expires) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, first_name, last_name, role, created_at`,
      [email, passwordHash, firstName, lastName, role, gdprConsent, gdprConsent ? new Date() : null, dataRetentionExpires]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user's last login
const updateLastLogin = async (userId) => {
  try {
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

// Rate limiting for login attempts
const recordFailedLogin = async (email) => {
  try {
    const result = await db.query(
      'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE email = $1 RETURNING failed_login_attempts',
      [email]
    );
    
    if (result.rows.length > 0) {
      const attempts = result.rows[0].failed_login_attempts;
      
      // Lock account for 15 minutes after 5 failed attempts
      if (attempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 15);
        
        await db.query(
          'UPDATE users SET locked_until = $1 WHERE email = $2',
          [lockUntil, email]
        );
      }
      
      return attempts;
    }
    
    return 0;
  } catch (error) {
    console.error('Error recording failed login:', error);
    throw error;
  }
};

// Reset failed login attempts
const resetFailedLogins = async (email) => {
  try {
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = $1',
      [email]
    );
  } catch (error) {
    console.error('Error resetting failed logins:', error);
    throw error;
  }
};

// Check if user is locked
const isUserLocked = async (email) => {
  try {
    const result = await db.query(
      'SELECT locked_until FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      const lockedUntil = result.rows[0].locked_until;
      if (lockedUntil && new Date() < new Date(lockedUntil)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if user is locked:', error);
    throw error;
  }
};

// Get user by ID
const getUserById = async (userId) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (userId, userData) => {
  try {
    const { firstName, lastName, email } = userData;
    
    const result = await db.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() 
       WHERE id = $4 AND is_active = true 
       RETURNING id, email, first_name, last_name, role, created_at, last_login, gdpr_consent, gdpr_consent_date`,
      [firstName, lastName, email, userId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user password
const updateUserPassword = async (userId, newPassword) => {
  try {
    const passwordHash = await hashPassword(newPassword);
    
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

// Generate password reset token
const generatePasswordResetToken = async (email) => {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour
    
    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );
    
    return resetToken;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    throw error;
  }
};

// Verify password reset token
const verifyPasswordResetToken = async (token) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW() AND is_active = true',
      [token]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    throw error;
  }
};

// Reset password with token
const resetPasswordWithToken = async (token, newPassword) => {
  try {
    const user = await verifyPasswordResetToken(token);
    if (!user) {
      return false;
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await db.query(
      `UPDATE users 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, 
           failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() 
       WHERE id = $2`,
      [passwordHash, user.id]
    );
    
    // Invalidate all existing sessions for security
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [user.id]
    );
    
    return true;
  } catch (error) {
    console.error('Error resetting password with token:', error);
    throw error;
  }
};

// Generate email verification token
const generateEmailVerificationToken = async (email) => {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    // Generate secure random token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours
    
    await db.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, user.id]
    );
    
    return verificationToken;
  } catch (error) {
    console.error('Error generating email verification token:', error);
    throw error;
  }
};

// Verify email verification token
const verifyEmailVerificationToken = async (token) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW() AND is_active = true',
      [token]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error verifying email verification token:', error);
    throw error;
  }
};

// Verify email with token
const verifyEmailWithToken = async (token) => {
  try {
    const user = await verifyEmailVerificationToken(token);
    if (!user) {
      return false;
    }
    
    await db.query(
      `UPDATE users 
       SET is_verified = true, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW() 
       WHERE id = $1`,
      [user.id]
    );
    
    return true;
  } catch (error) {
    console.error('Error verifying email with token:', error);
    throw error;
  }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // 7 day refresh token
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await getUserById(decoded.id);
    if (!user || !user.is_active) {
      return null;
    }
    
    // Generate new access token
    const newAccessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    return {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified
      }
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

// Get user certificate history
const getUserCertificates = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT uc.*, ch.status, ch.verification_count 
       FROM user_certificates uc
       LEFT JOIN certificate_hashes ch ON uc.certificate_id = ch.certificate_id
       WHERE uc.user_id = $1
       ORDER BY uc.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user certificates:', error);
    throw error;
  }
};

// Add certificate to user history
const addUserCertificate = async (userId, certificateData) => {
  try {
    const { certificateId, studentName, courseName, issueDate, templateId } = certificateData;
    
    const result = await db.query(
      `INSERT INTO user_certificates (user_id, certificate_id, student_name, course_name, issue_date, template_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, certificateId, studentName, courseName, issueDate, templateId || 'standard']
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error adding user certificate:', error);
    throw error;
  }
};

// Update certificate download count
const updateCertificateDownload = async (userId, certificateId) => {
  try {
    await db.query(
      `UPDATE user_certificates 
       SET download_count = download_count + 1, last_downloaded = NOW() 
       WHERE user_id = $1 AND certificate_id = $2`,
      [userId, certificateId]
    );
  } catch (error) {
    console.error('Error updating certificate download:', error);
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  authorizeRole,
  createSession,
  invalidateSession,
  cleanExpiredSessions,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserProfile,
  updateUserPassword,
  updateLastLogin,
  recordFailedLogin,
  resetFailedLogins,
  isUserLocked,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  resetPasswordWithToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  verifyEmailWithToken,
  generateRefreshToken,
  refreshAccessToken,
  getUserCertificates,
  addUserCertificate,
  updateCertificateDownload
};