// Local Storage Helpers for the auth simulation layer.
//
// SECURITY NOTES (client-side demo):
// - Admin passwords are never stored in plaintext — only SHA-256 hashes.
// - Sessions carry an expiry timestamp and are invalidated on read once expired.
// - This is still a client-side simulation: real enforcement belongs in a
//   backend API (see services/authService.js for the endpoint shapes).

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const DEMO_CITIZENS = [
  {
    aadhaar: "123456789012",
    mobile: "9876543210",
    name: "Demo Citizen",
    address: "123 MG Road, Pune, Maharashtra - 411001",
    email: "citizen@example.com",
  },
];

// Demo admins — passwords are hashed before they ever touch storage.
// role: "super_admin" sees everything; "department_admin" is scoped by the
// backend to their department's complaints, map pins, analytics and alerts.
// One department admin exists per municipal department.
const DEMO_ADMINS = [
  {
    username: "admin",
    name: "System Administrator",
    role: "super_admin",
    department: null,
    password: "admin123", // local simulation only — hashed on seed
  },
  {
    username: "water_admin",
    name: "Water Dept. Admin",
    role: "department_admin",
    department: "Water Supply Department",
    password: "water123",
  },
  {
    username: "electricity_admin",
    name: "Electricity Dept. Admin",
    role: "department_admin",
    department: "Electricity Department",
    password: "electricity123",
  },
  {
    username: "roads_admin",
    name: "Roads & Drainage Admin",
    role: "department_admin",
    department: "Roads and Drainage",
    password: "roads123",
  },
  {
    username: "swm_admin",
    name: "Solid Waste Admin",
    role: "department_admin",
    department: "Solid Waste Management",
    password: "swm123",
  },
  {
    username: "health_admin",
    name: "Public Health Admin",
    role: "department_admin",
    department: "Public Health",
    password: "health123",
  },
  {
    username: "traffic_admin",
    name: "Traffic Police Admin",
    role: "department_admin",
    department: "Traffic Police",
    password: "traffic123",
  },
];

/** SHA-256 hex digest via Web Crypto. */
export const hashText = async (text) => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// Initialize users and admins database in local storage on first load.
// Async because seeding/migrating admin records requires hashing.
export const initLocalStorageData = async () => {
  // ── Citizens ──
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(DEMO_CITIZENS));
  } else {
    try {
      const parsed = JSON.parse(localStorage.getItem("users"));
      if (Array.isArray(parsed)) {
        let changed = false;
        const updated = parsed.map((c) => {
          if (c.aadhaar === "123456789012" && !c.address) {
            changed = true;
            return {
              ...c,
              address: "123 MG Road, Pune, Maharashtra - 411001",
              email: "citizen@example.com",
            };
          }
          return c;
        });
        if (changed) {
          localStorage.setItem("users", JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn("Migration correction failed:", e);
    }
  }

  // ── Admins (hashed passwords only) ──
  try {
    const raw = localStorage.getItem("admins");
    const seedAdmins = async () => {
      const seeded = await Promise.all(
        DEMO_ADMINS.map(async ({ password, ...rest }) => ({
          ...rest,
          passwordHash: await hashText(password),
        }))
      );
      localStorage.setItem("admins", JSON.stringify(seeded));
    };

    if (!raw) {
      await seedAdmins();
    } else {
      let admins = JSON.parse(raw);
      if (!Array.isArray(admins)) {
        await seedAdmins();
      } else {
        let changed = false;

        // Migrate any legacy plaintext-password records to hashed form.
        admins = await Promise.all(
          admins.map(async (a) => {
            if (!a.password) return a;
            changed = true;
            const { password, ...rest } = a;
            return { ...rest, passwordHash: await hashText(password) };
          })
        );

        // Backfill role on legacy super admin records.
        admins.forEach((a) => {
          if (a.username === "admin" && !a.role) {
            a.role = "super_admin";
            changed = true;
          }
        });

        // Append any demo admins missing from older stores (e.g. new
        // department-admin accounts added after the store was first seeded).
        for (const demo of DEMO_ADMINS) {
          if (!admins.some((a) => a.username === demo.username)) {
            const { password, ...rest } = demo;
            admins.push({ ...rest, passwordHash: await hashText(password) });
            changed = true;
          }
        }

        if (changed) localStorage.setItem("admins", JSON.stringify(admins));
      }
    }
  } catch (e) {
    console.warn("Admin store initialization failed:", e);
  }
};

// Retrieve users from local storage
export const getLocalStorageUsers = () => {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
};

// Retrieve admins from local storage
export const getLocalStorageAdmins = () => {
  const admins = localStorage.getItem("admins");
  return admins ? JSON.parse(admins) : [];
};

// Save a citizen user to simulated DB (optional utility)
export const saveLocalStorageUser = (user) => {
  const users = getLocalStorageUsers();
  if (!users.some((u) => u.aadhaar === user.aadhaar)) {
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
  }
};

// ── Session managers (with expiry) ──────────────────────────────────────────

export const getCurrentSessionUser = () => {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    // Reject sessions without an expiry (legacy) or past their expiry.
    if (!session.expiresAt || Date.now() > session.expiresAt) {
      removeCurrentSessionUser();
      return null;
    }
    return session;
  } catch {
    removeCurrentSessionUser();
    return null;
  }
};

export const setCurrentSessionUser = (sessionData) => {
  const stamped = {
    ...sessionData,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem("currentUser", JSON.stringify(stamped));
  return stamped;
};

export const removeCurrentSessionUser = () => {
  localStorage.removeItem("currentUser");
};
