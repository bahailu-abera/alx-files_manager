import request from 'supertest';
import app from '../server';

describe('endpoint Tests', () => {
  // GET /status
  describe('gET /status', () => {
    it('should return status 200 and status of Redis and MongoDB', async () => {
      const response = await request(app).get('/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('redis');
      expect(response.body).toHaveProperty('db');
    });
  });

  // GET /stats
  describe('gET /stats', () => {
    it('should return status 200 and user and file counts', async () => {
      const response = await request(app).get('/stats');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('files');
    });
  });

  // POST /users
  describe('pOST /users', () => {
    it('should create a new user and return status 201 with user data', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'test123',
      };
      const response = await request(app).post('/users').send(newUser);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', newUser.email);
    });
  });

  // GET /connect
  describe('gET /connect', () => {
    it('should return status 200 and a token', async () => {
      const response = await request(app).get('/connect');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  // GET /disconnect
  describe('gET /disconnect', () => {
    it('should return status 204', async () => {
      const response = await request(app).get('/disconnect');
      expect(response.status).toBe(204);
    });
  });

  // GET /users/me
  describe('gET /users/me', () => {
    it('should return status 200 and user data', async () => {
      const response = await request(app).get('/users/me');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });
  });

  // POST /files
  describe('pOST /files', () => {
    it('should upload a file and return status 201 with file data', async () => {
      // Create a test file or use a sample file for upload
      const file = {
        // Provide necessary file data
      };
      const response = await request(app).post('/files').send(file);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
    });
  });

  // GET /files/:id
  describe('gET /files/:id', () => {
    it('should return status 200 and file data', async () => {
      const fileId = 'example-file-id'; // Replace with an actual file ID
      const response = await request(app).get(`/files/${fileId}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', fileId);
      expect(response.body).toHaveProperty('filename');
    });
  });

  // GET /files (pagination)
  describe('gET /files', () => {
    it('should return status 200 and paginated file data', async () => {
      const page = 1; // Provide the page number
      const limit = 10; // Provide the limit per page
      const response = await request(app).get('/files').query({ page, limit });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage', page);
      expect(response.body).toHaveProperty('perPage', limit);
    });
  });

  // PUT /files/:id/publish
  describe('pUT /files/:id/publish', () => {
    it('should update file public status to true and return status 200', async () => {
      const fileId = 'example-file-id'; // Replace with an actual file ID
      const response = await request(app).put(`/files/${fileId}/publish`);
      expect(response.status).toBe(200);
    });
  });

  // PUT /files/:id/unpublish
  describe('pUT /files/:id/unpublish', () => {
    it('should update file public status to false and return status 200', async () => {
      const fileId = 'example-file-id'; // Replace with an actual file ID
      const response = await request(app).put(`/files/${fileId}/unpublish`);
      expect(response.status).toBe(200);
    });
  });

  // GET /files/:id/data
  describe('gET /files/:id/data', () => {
    it('should return status 200 and file data', async () => {
      const fileId = 'example-file-id'; // Replace with an actual file ID
      const response = await request(app).get(`/files/${fileId}/data`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', fileId);
      expect(response.body).toHaveProperty('data');
    });
  });
});
