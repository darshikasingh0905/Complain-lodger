import {
  getLocalStorageUsers,
  getLocalStorageAdmins,
  getCurrentSessionUser,
  setCurrentSessionUser,
  removeCurrentSessionUser,
  hashText,
} from "../utils/localStorageHelpers";

/**
 * Service layer simulating authentication API calls.
 * Shapes match the future backend endpoints (POST /auth/...), so this file
 * can be swapped for real HTTP calls without touching the UI.
 *
 * Hardening applied to the simulation:
 * - OTPs are random 6-digit codes (crypto RNG), stored only as SHA-256 hashes,
 *   expire after 5 minutes and allow at most 5 attempts.
 * - Admin passwords are compared by hash; 5 failed logins lock the account
 *   for 15 minutes.
 * - Sessions expire (see localStorageHelpers).
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const OTP_STORE_KEY = "pending_otp";
const LOCKOUT_STORE_KEY = "admin_lockout";

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Cryptographically random 6-digit code. */
const generateOtp = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1000000).padStart(6, "0");
};

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getLockout = () => readJson(localStorage, LOCKOUT_STORE_KEY) || { failures: 0, lockedUntil: 0 };
const setLockout = (data) => localStorage.setItem(LOCKOUT_STORE_KEY, JSON.stringify(data));

// ── Public API ────────────────────────────────────────────────────────────────

export const authService = {
  // Simulate POST /auth/citizen/send-otp
  sendOTP: async (aadhaar, mobile) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanAadhaar = aadhaar.replace(/\s+/g, "");
    const users = getLocalStorageUsers();

    const userMatch = users.find(
      (u) => u.aadhaar === cleanAadhaar && u.mobile === mobile
    );

    if (!userMatch) {
      throw new Error("Aadhaar number or linked mobile number is incorrect.");
    }

    // Server-side style resend throttle (UI also enforces a 30s timer).
    const existing = readJson(sessionStorage, OTP_STORE_KEY);
    if (existing && Date.now() - existing.issuedAt < OTP_RESEND_COOLDOWN_MS) {
      throw new Error("Please wait a moment before requesting a new OTP.");
    }

    const otp = generateOtp();
    const record = {
      aadhaar: cleanAadhaar,
      mobile,
      otpHash: await hashText(otp),
      issuedAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    };

    // DEV ONLY: expose the code so the flow is testable without SMS delivery.
    // import.meta.env.DEV is false in production builds, so this branch (and
    // the plaintext code) is stripped from deployed bundles.
    if (import.meta.env.DEV) {
      record.devOtp = otp;
      console.info(`[DEV] OTP for ${mobile}: ${otp}`);
    }

    sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(record));

    return {
      success: true,
      message: "OTP has been sent to your Aadhaar-registered mobile number.",
    };
  },

  // Simulate POST /auth/citizen/verify-otp
  verifyOTP: async (aadhaar, mobile, otp) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanAadhaar = aadhaar.replace(/\s+/g, "");
    const pending = readJson(sessionStorage, OTP_STORE_KEY);

    if (!pending || pending.aadhaar !== cleanAadhaar || pending.mobile !== mobile) {
      throw new Error("No active OTP request found. Please request a new OTP.");
    }

    if (Date.now() > pending.expiresAt) {
      sessionStorage.removeItem(OTP_STORE_KEY);
      throw new Error("This OTP has expired. Please request a new one.");
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      sessionStorage.removeItem(OTP_STORE_KEY);
      throw new Error("Too many incorrect attempts. Please request a new OTP.");
    }

    const otpHash = await hashText(otp);
    if (otpHash !== pending.otpHash) {
      pending.attempts += 1;
      sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(pending));
      const left = OTP_MAX_ATTEMPTS - pending.attempts;
      throw new Error(
        left > 0
          ? `Invalid OTP code. ${left} attempt${left === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new OTP."
      );
    }

    // Success — single-use: invalidate the OTP immediately.
    sessionStorage.removeItem(OTP_STORE_KEY);

    const users = getLocalStorageUsers();
    const userMatch = users.find(
      (u) => u.aadhaar === cleanAadhaar && u.mobile === mobile
    );
    if (!userMatch) {
      throw new Error("Aadhaar number or linked mobile number is incorrect.");
    }

    const sessionPayload = {
      isAuthenticated: true,
      role: "citizen",
      user: {
        aadhaar: userMatch.aadhaar,
        mobile: userMatch.mobile,
        name: userMatch.name,
        address: userMatch.address || "",
        email: userMatch.email || "",
      },
    };

    setCurrentSessionUser(sessionPayload);
    return sessionPayload;
  },

  // Simulate POST /auth/admin/login
  adminLogin: async (username, password) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Lockout check
    const lockout = getLockout();
    if (lockout.lockedUntil > Date.now()) {
      const mins = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
      throw new Error(
        `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`
      );
    }

    const admins = getLocalStorageAdmins();
    const passwordHash = await hashText(password);
    const adminMatch = admins.find(
      (a) =>
        a.username.toLowerCase() === username.toLowerCase() &&
        a.passwordHash === passwordHash
    );

    if (!adminMatch) {
      const failures = lockout.failures + 1;
      setLockout({
        failures,
        lockedUntil: failures >= LOGIN_MAX_FAILURES ? Date.now() + LOGIN_LOCKOUT_MS : 0,
      });
      // Generic message — never reveal which field was wrong.
      throw new Error("Invalid username or password.");
    }

    // Success — reset the failure counter.
    setLockout({ failures: 0, lockedUntil: 0 });

    const sessionPayload = {
      isAuthenticated: true,
      role: "admin",
      user: {
        username: adminMatch.username,
        name: adminMatch.name,
        // super_admin sees everything; department_admin is scoped server-side
        adminRole: adminMatch.role || "super_admin",
        department: adminMatch.department || null,
      },
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

  // Read current active (non-expired) session
  getCurrentUser: () => {
    return getCurrentSessionUser();
  },

  // DEV ONLY: surface the generated OTP for the on-screen hint.
  // Always returns null in production builds.
  getDevOtp: () => {
    if (!import.meta.env.DEV) return null;
    const pending = readJson(sessionStorage, OTP_STORE_KEY);
    return pending?.devOtp || null;
  },
};
