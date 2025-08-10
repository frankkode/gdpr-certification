const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { db } = require('../db');

// Generate TOTP secret for user
const generateTOTPSecret = async (userId, userEmail) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `CertifySecure (${userEmail})`,
      issuer: 'CertifySecure',
      length: 32
    });

    // Store the secret in database
    const query = `
      UPDATE users 
      SET 
        two_factor_secret = $1,
        two_factor_backup_codes = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id
    `;

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    await db.query(query, [secret.base32, JSON.stringify(backupCodes), userId]);

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      backupCodes: backupCodes
    };
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw new Error('Failed to generate 2FA secret');
  }
};

// Generate backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-digit backup codes
    const code = Math.random().toString().substr(2, 8);
    codes.push(code);
  }
  return codes;
};

// Generate QR code image
const generateQRCode = async (otpUrl) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify TOTP token
const verifyTOTPToken = async (userId, token) => {
  try {
    // Get user's 2FA secret
    const query = `
      SELECT two_factor_secret, two_factor_backup_codes, two_factor_last_used
      FROM users 
      WHERE id = $1 AND two_factor_enabled = true
    `;
    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return { valid: false, error: '2FA not enabled for this user' };
    }

    const { two_factor_secret, two_factor_backup_codes, two_factor_last_used } = result.rows[0];

    // Check if token was recently used (prevent replay attacks)
    const now = Date.now();
    const lastUsed = two_factor_last_used ? new Date(two_factor_last_used).getTime() : 0;
    const window = 30010; // 30 seconds

    if (now - lastUsed < window) {
      return { valid: false, error: 'Token was recently used. Please wait and try again.' };
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow 1 step before/after current time
    });

    if (verified) {
      // Update last used timestamp
      await db.query(
        'UPDATE users SET two_factor_last_used = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      return { valid: true, method: 'totp' };
    }

    // Check backup codes if TOTP failed
    if (two_factor_backup_codes) {
      const backupCodes = JSON.parse(two_factor_backup_codes);
      const codeIndex = backupCodes.indexOf(token);

      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await db.query(
          'UPDATE users SET two_factor_backup_codes = $1, two_factor_last_used = CURRENT_TIMESTAMP WHERE id = $2',
          [JSON.stringify(backupCodes), userId]
        );
        return { valid: true, method: 'backup' };
      }
    }

    return { valid: false, error: 'Invalid authentication code' };
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return { valid: false, error: 'Verification failed' };
  }
};

// Enable 2FA for user
const enableTwoFactor = async (userId, verificationToken) => {
  try {
    // First verify the token
    const verification = await verifyTOTPToken(userId, verificationToken);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    // Enable 2FA
    const query = `
      UPDATE users 
      SET 
        two_factor_enabled = true,
        two_factor_last_used = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    await db.query(query, [userId]);

    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
};

// Disable 2FA for user
const disableTwoFactor = async (userId, verificationToken, password) => {
  try {
    // Verify current password and 2FA token
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const bcrypt = require('bcryptjs');
    const passwordValid = await bcrypt.compare(password, userResult.rows[0].password_hash);

    if (!passwordValid) {
      return { success: false, error: 'Invalid password' };
    }

    // Verify 2FA token
    const verification = await verifyTOTPToken(userId, verificationToken);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    // Disable 2FA
    const query = `
      UPDATE users 
      SET 
        two_factor_enabled = false,
        two_factor_secret = NULL,
        two_factor_backup_codes = NULL,
        two_factor_last_used = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    await db.query(query, [userId]);

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
};

// Get user's 2FA status
const getTwoFactorStatus = async (userId) => {
  try {
    const query = `
      SELECT 
        two_factor_enabled,
        two_factor_secret IS NOT NULL as has_secret,
        CASE 
          WHEN two_factor_backup_codes IS NOT NULL 
          THEN array_length(CAST(two_factor_backup_codes AS json[]::text[]), 1)
          ELSE 0 
        END as backup_codes_remaining
      FROM users 
      WHERE id = $1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return { enabled: false, hasSecret: false, backupCodesRemaining: 0 };
    }

    const row = result.rows[0];
    return {
      enabled: row.two_factor_enabled,
      hasSecret: row.has_secret,
      backupCodesRemaining: row.backup_codes_remaining || 0
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return { enabled: false, hasSecret: false, backupCodesRemaining: 0 };
  }
};

// Regenerate backup codes
const regenerateBackupCodes = async (userId, verificationToken) => {
  try {
    // Verify 2FA token
    const verification = await verifyTOTPToken(userId, verificationToken);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes();

    const query = `
      UPDATE users 
      SET 
        two_factor_backup_codes = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;

    await db.query(query, [JSON.stringify(newBackupCodes), userId]);

    return { success: true, backupCodes: newBackupCodes };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return { success: false, error: 'Failed to regenerate backup codes' };
  }
};

// Middleware to require 2FA verification
const requireTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has 2FA enabled
    const status = await getTwoFactorStatus(userId);
    if (!status.enabled) {
      return next(); // 2FA not enabled, continue
    }

    // Check if 2FA token is provided
    const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;
    if (!twoFactorToken) {
      return res.status(200).json({
        requiresTwoFactor: true,
        message: 'Two-factor authentication required'
      });
    }

    // Verify 2FA token
    const verification = await verifyTOTPToken(userId, twoFactorToken);
    if (!verification.valid) {
      return res.status(400).json({
        error: verification.error,
        requiresTwoFactor: true
      });
    }

    next();
  } catch (error) {
    console.error('2FA middleware error:', error);
    res.status(500).json({ error: 'Two-factor authentication error' });
  }
};

module.exports = {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  regenerateBackupCodes,
  requireTwoFactor
};