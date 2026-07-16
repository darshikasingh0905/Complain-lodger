import {
  getLocalStorageUsers,
  getLocalStorageAdmins,
  getCurrentSessionUser,
  setCurrentSessionUser,
  removeCurrentSessionUser
} from '../utils/localStorageHelpers';

/**
 * Service layer simulating authentication API calls.
 * Can be replaced by real backend REST API service in the future.
 */
export const authService = {
  // Simulate POST /auth/citizen/send-otp
  sendOTP: async (aadhaar, mobile) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Remove any formatting spaces from Aadhaar
    const cleanAadhaar = aadhaar.replace(/\s+/g, '');
    const users = getLocalStorageUsers();
    
    const userMatch = users.find(
      (u) => u.aadhaar === cleanAadhaar && u.mobile === mobile
    );

    if (!userMatch) {
      throw new Error("Aadhaar number or linked mobile number is incorrect.");
    }

    // Success response: returns mock payload
    return {
      success: true,
      message: "OTP has been sent to your Aadhaar-registered mobile number."
    };
  },

  // Simulate POST /auth/citizen/verify-otp
  verifyOTP: async (aadhaar, mobile, otp) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanAadhaar = aadhaar.replace(/\s+/g, '');
    const users = getLocalStorageUsers();

    const userMatch = users.find(
      (u) => u.aadhaar === cleanAadhaar && u.mobile === mobile
    );

    if (!userMatch) {
      throw new Error("Aadhaar number or linked mobile number is incorrect.");
    }

    if (otp !== "123456") {
      throw new Error("Invalid OTP code. Please try again.");
    }

    const sessionPayload = {
      isAuthenticated: true,
      role: 'citizen',
      user: {
        aadhaar: userMatch.aadhaar,
        mobile: userMatch.mobile,
        name: userMatch.name,
        address: userMatch.address || '',
        email: userMatch.email || ''
      }
    };

    setCurrentSessionUser(sessionPayload);
    return sessionPayload;
  },

  // Simulate POST /auth/admin/login
  adminLogin: async (username, password) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const admins = getLocalStorageAdmins();
    const adminMatch = admins.find(
      (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
    );

    if (!adminMatch) {
      throw new Error("Invalid username or password.");
    }

    const sessionPayload = {
      isAuthenticated: true,
      role: 'admin',
      adminRole: adminMatch.role || 'super_admin',
      adminDepartment: adminMatch.department || null,
      user: {
        username: adminMatch.username,
        name: adminMatch.name,
        email: adminMatch.email || adminMatch.username,
        adminRole: adminMatch.role || 'super_admin',
        adminDepartment: adminMatch.department || null,
      }
    };

    setCurrentSessionUser(sessionPayload);
    return sessionPayload;
  },

  // Simulate POST /auth/logout
  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    removeCurrentSessionUser();
    return { success: true };
  },

  // Read current active session
  getCurrentUser: () => {
    return getCurrentSessionUser();
  }
};
