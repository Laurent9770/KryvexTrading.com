const { Pool } = require('pg');
const websocketService = require('./websocketService');

class RequestService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // Create a new admin request
  async createRequest(userId, requestType, title, description, requestData = {}) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO admin_requests (user_id, request_type, title, description, request_data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        userId, requestType, title, description, JSON.stringify(requestData)
      ]);

      const request = result.rows[0];

      // Notify admins via WebSocket
      websocketService.sendToAdmins({
        type: 'admin:request-received',
        data: {
          requestId: request.id,
          requestType: request.request_type,
          title: request.title,
          userId: request.user_id,
          createdAt: request.created_at
        }
      });

      return request;
    } finally {
      client.release();
    }
  }

  // Get all pending requests (admin only)
  async getPendingRequests() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          ar.*,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM admin_requests ar
        LEFT JOIN users u ON ar.user_id = u.id
        LEFT JOIN users admin ON ar.admin_id = admin.id
        ORDER BY ar.created_at DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get requests for a specific user
  async getUserRequests(userId) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM admin_requests 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Process a request (approve/reject)
  async processRequest(requestId, adminId, status, response = '') {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE admin_requests 
        SET status = $1, admin_response = $2, admin_id = $3, processed_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await client.query(query, [status, response, adminId, requestId]);
      
      if (result.rows.length === 0) {
        throw new Error('Request not found');
      }

      const request = result.rows[0];

      // Notify user via WebSocket
      websocketService.sendToClient(request.user_id, {
        type: 'user:request-updated',
        data: {
          requestId: request.id,
          status: request.status,
          adminResponse: request.admin_response,
          processedAt: request.processed_at
        }
      });

      return request;
    } finally {
      client.release();
    }
  }

  // Get request statistics
  async getRequestStats() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
        FROM admin_requests
      `;
      
      const result = await client.query(query);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Delete old processed requests (cleanup)
  async cleanupOldRequests(daysOld = 30) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        DELETE FROM admin_requests 
        WHERE processed_at IS NOT NULL 
        AND processed_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      `;
      
      const result = await client.query(query);
      return result.rowCount;
    } finally {
      client.release();
    }
  }
}

module.exports = new RequestService(); 