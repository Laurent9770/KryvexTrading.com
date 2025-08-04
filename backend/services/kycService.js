const { query, transaction } = require('../database/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class KYCService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  // Configure multer for file uploads
  configureMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(this.uploadPath, 'kyc');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.user.id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Create KYC submission
  async createKYCSubmission(userId, level, documents = []) {
    try {
      const result = await query(
        `INSERT INTO kyc_submissions (user_id, level, status, documents)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, level, status, documents, created_at`,
        [userId, level, 'pending', JSON.stringify(documents)]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Create KYC submission error:', error);
      throw new Error('Failed to create KYC submission');
    }
  }

  // Get user's KYC submissions
  async getUserKYCSubmissions(userId) {
    try {
      const result = await query(
        `SELECT id, level, status, documents, admin_notes, created_at, updated_at
         FROM kyc_submissions 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user KYC submissions error:', error);
      throw new Error('Failed to get KYC submissions');
    }
  }

  // Get specific KYC submission
  async getKYCSubmission(submissionId) {
    try {
      const result = await query(
        `SELECT ks.*, u.email, u.first_name, u.last_name
         FROM kyc_submissions ks
         JOIN users u ON ks.user_id = u.id
         WHERE ks.id = $1`,
        [submissionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Get KYC submission error:', error);
      throw new Error('Failed to get KYC submission');
    }
  }

  // Update KYC submission status
  async updateKYCStatus(submissionId, status, adminNotes = null, adminId = null) {
    try {
      const result = await transaction(async (client) => {
        // Update KYC submission
        const submissionResult = await client.query(
          `UPDATE kyc_submissions 
           SET status = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING id, user_id, level, status, admin_notes`,
          [submissionId, status, adminNotes]
        );

        if (submissionResult.rows.length === 0) {
          throw new Error('KYC submission not found');
        }

        const submission = submissionResult.rows[0];

        // If approved, update user verification status
        if (status === 'approved') {
          await client.query(
            `UPDATE users 
             SET is_verified = true, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [submission.user_id]
          );
        }

        // Log admin action if adminId provided
        if (adminId) {
          await client.query(
            `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [adminId, 'kyc_status_update', submission.user_id, JSON.stringify({
              submissionId,
              level: submission.level,
              status,
              adminNotes
            }), null]
          );
        }

        return submission;
      });

      return result;
    } catch (error) {
      console.error('Update KYC status error:', error);
      throw new Error('Failed to update KYC status');
    }
  }

  // Add document to KYC submission
  async addDocument(submissionId, documentType, fileUrl) {
    try {
      const result = await query(
        `INSERT INTO kyc_documents (submission_id, type, file_url)
         VALUES ($1, $2, $3)
         RETURNING id, submission_id, type, file_url, created_at`,
        [submissionId, documentType, fileUrl]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Add KYC document error:', error);
      throw new Error('Failed to add KYC document');
    }
  }

  // Get documents for KYC submission
  async getKYCDocuments(submissionId) {
    try {
      const result = await query(
        `SELECT id, type, file_url, verified_at, created_at
         FROM kyc_documents 
         WHERE submission_id = $1
         ORDER BY created_at`,
        [submissionId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get KYC documents error:', error);
      throw new Error('Failed to get KYC documents');
    }
  }

  // Admin: Get all KYC submissions
  async getAllKYCSubmissions(limit = 50, offset = 0, status = null, level = null) {
    try {
      let queryText = `
        SELECT ks.id, ks.level, ks.status, ks.documents, ks.admin_notes, ks.created_at, ks.updated_at,
               u.email, u.first_name, u.last_name, u.is_verified
        FROM kyc_submissions ks
        JOIN users u ON ks.user_id = u.id
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        queryText += ` WHERE ks.status = $${++paramCount}`;
        params.push(status);
      }

      if (level) {
        const whereClause = status ? 'AND' : 'WHERE';
        queryText += ` ${whereClause} ks.level = $${++paramCount}`;
        params.push(level);
      }

      queryText += ` ORDER BY ks.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Get all KYC submissions error:', error);
      throw new Error('Failed to get KYC submissions');
    }
  }

  // Admin: Get KYC statistics
  async getKYCStats() {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_submissions,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_submissions,
          COUNT(CASE WHEN level = 1 THEN 1 END) as level1_submissions,
          COUNT(CASE WHEN level = 2 THEN 1 END) as level2_submissions,
          COUNT(CASE WHEN level = 3 THEN 1 END) as level3_submissions
        FROM kyc_submissions
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Get KYC stats error:', error);
      throw new Error('Failed to get KYC statistics');
    }
  }

  // Verify document (admin function)
  async verifyDocument(documentId, adminId) {
    try {
      const result = await query(
        `UPDATE kyc_documents 
         SET verified_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, submission_id, type, file_url, verified_at`,
        [documentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      // Log admin action
      await query(
        `INSERT INTO admin_actions (admin_id, action_type, details, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [adminId, 'document_verification', JSON.stringify({
          documentId,
          documentType: result.rows[0].type,
          submissionId: result.rows[0].submission_id
        }), null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Verify document error:', error);
      throw new Error('Failed to verify document');
    }
  }

  // Get user verification status
  async getUserVerificationStatus(userId) {
    try {
      const result = await query(
        `SELECT u.is_verified,
                COUNT(ks.id) as total_submissions,
                COUNT(CASE WHEN ks.status = 'approved' THEN 1 END) as approved_submissions,
                MAX(ks.level) as highest_level
         FROM users u
         LEFT JOIN kyc_submissions ks ON u.id = ks.user_id
         WHERE u.id = $1
         GROUP BY u.is_verified`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          isVerified: false,
          totalSubmissions: 0,
          approvedSubmissions: 0,
          highestLevel: 0
        };
      }

      return {
        isVerified: result.rows[0].is_verified,
        totalSubmissions: parseInt(result.rows[0].total_submissions) || 0,
        approvedSubmissions: parseInt(result.rows[0].approved_submissions) || 0,
        highestLevel: parseInt(result.rows[0].highest_level) || 0
      };
    } catch (error) {
      console.error('Get user verification status error:', error);
      throw new Error('Failed to get verification status');
    }
  }

  // Delete KYC submission (admin function)
  async deleteKYCSubmission(submissionId, adminId) {
    try {
      const result = await transaction(async (client) => {
        // Get submission details for logging
        const submissionResult = await client.query(
          `SELECT user_id, level FROM kyc_submissions WHERE id = $1`,
          [submissionId]
        );

        if (submissionResult.rows.length === 0) {
          throw new Error('KYC submission not found');
        }

        const submission = submissionResult.rows[0];

        // Delete associated documents
        await client.query(
          `DELETE FROM kyc_documents WHERE submission_id = $1`,
          [submissionId]
        );

        // Delete submission
        await client.query(
          `DELETE FROM kyc_submissions WHERE id = $1`,
          [submissionId]
        );

        // Log admin action
        await client.query(
          `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, 'kyc_submission_deleted', submission.user_id, JSON.stringify({
            submissionId,
            level: submission.level
          }), null]
        );

        return { success: true };
      });

      return result;
    } catch (error) {
      console.error('Delete KYC submission error:', error);
      throw new Error('Failed to delete KYC submission');
    }
  }

  // Get KYC requirements for each level
  getKYCRequirements() {
    return {
      1: {
        name: 'Email Verification',
        description: 'Basic email verification required for all users',
        required: true,
        documents: []
      },
      2: {
        name: 'Identity Verification',
        description: 'Government-issued ID verification',
        required: true,
        documents: [
          { type: 'passport', name: 'Passport', required: true },
          { type: 'id_card', name: 'National ID Card', required: false },
          { type: 'drivers_license', name: 'Driver\'s License', required: false },
          { type: 'selfie', name: 'Selfie with ID', required: true }
        ]
      },
      3: {
        name: 'Advanced Verification',
        description: 'Additional verification for high-value transactions',
        required: false,
        documents: [
          { type: 'proof_of_address', name: 'Proof of Address', required: true },
          { type: 'bank_statement', name: 'Bank Statement', required: true },
          { type: 'income_proof', name: 'Income Proof', required: false }
        ]
      }
    };
  }

  // Validate KYC submission
  validateKYCSubmission(level, documents) {
    const requirements = this.getKYCRequirements()[level];
    
    if (!requirements) {
      throw new Error('Invalid KYC level');
    }

    if (level === 1) {
      // Level 1 only requires email verification (handled separately)
      return true;
    }

    // Check required documents for level 2 and 3
    const requiredDocs = requirements.documents.filter(doc => doc.required);
    const providedDocs = documents.map(doc => doc.type);

    for (const requiredDoc of requiredDocs) {
      if (!providedDocs.includes(requiredDoc.type)) {
        throw new Error(`Missing required document: ${requiredDoc.name}`);
      }
    }

    return true;
  }
}

module.exports = new KYCService(); 