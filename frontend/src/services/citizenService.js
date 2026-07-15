/**
 * citizenService.js
 * Abstracts all citizen profile data fetching.
 * Currently reads from localStorage session (post-OTP login).
 * Replace getCitizenProfile() body with a real API call in production:
 *   GET /citizen/profile  →  { name, aadhaar, mobile, address, email }
 */

import { getCurrentSessionUser } from '../utils/localStorageHelpers';

/**
 * Retrieve the authenticated citizen's profile from the active session.
 * @returns {Promise<Object>} citizen profile fields
 */
export const getCitizenProfile = async () => {
  // Simulate a short network round-trip
  await new Promise((resolve) => setTimeout(resolve, 150));

  const session = getCurrentSessionUser();

  if (!session || session.role !== 'citizen' || !session.user) {
    throw new Error('No authenticated citizen session found.');
  }

  const { aadhaar, mobile, name, address, email } = session.user;

  return {
    name:    name    || '',
    aadhaar: aadhaar || '',
    mobile:  mobile  || '',
    address: address || '',
    email:   email   || ''
  };
};
