// Test helper — sets up mock environment
// MUST run before dotenv loads. Set SUPABASE_URL to placeholder so mock mode activates.
// dotenv does NOT overwrite existing vars, so setting this first prevents real Supabase.
process.env.SUPABASE_URL = 'https://seu-projeto.supabase.co';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

import jwt from 'jsonwebtoken';

export function createTestToken(userId = 'test-user-id', businessId = 'test-business-id') {
  return jwt.sign({ userId, businessId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Use the demo user IDs from the mock database
export const TEST_USER_ID = 'demo-user-id';
export const TEST_BUSINESS_ID = 'demo-business-id';
export const TEST_TOKEN = createTestToken(TEST_USER_ID, TEST_BUSINESS_ID);
