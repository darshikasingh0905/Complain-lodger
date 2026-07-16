// Local Storage Helpers for Authentication System (Development Mode)

const DEMO_CITIZENS = [
  {
    aadhaar: "123456789012",
    mobile: "9876543210",
    name: "Demo Citizen",
    address: "123 MG Road, Pune, Maharashtra - 411001",
    email: "citizen@example.com"
  }
];

// Super admin + 6 department admins (hackathon demo accounts)
const DEMO_ADMINS = [
  {
    username: "admin",
    email: "admin@admin.com",
    password: "admin123",
    name: "System Administrator",
    role: "super_admin",
    department: null
  },
  {
    username: "admin@roads.com",
    email: "admin@roads.com",
    password: "admin123",
    name: "Roads Department Admin",
    role: "department_admin",
    department: "Roads"
  },
  {
    username: "admin@electricity.com",
    email: "admin@electricity.com",
    password: "admin123",
    name: "Electricity Department Admin",
    role: "department_admin",
    department: "Electricity"
  },
  {
    username: "admin@water.com",
    email: "admin@water.com",
    password: "admin123",
    name: "Water Supply Department Admin",
    role: "department_admin",
    department: "Water Supply"
  },
  {
    username: "admin@garbage.com",
    email: "admin@garbage.com",
    password: "admin123",
    name: "Sanitation Department Admin",
    role: "department_admin",
    department: "Sanitation"
  },
  {
    username: "admin@health.com",
    email: "admin@health.com",
    password: "admin123",
    name: "Health Department Admin",
    role: "department_admin",
    department: "Health"
  },
  {
    username: "admin@transport.com",
    email: "admin@transport.com",
    password: "admin123",
    name: "Transport Department Admin",
    role: "department_admin",
    department: "Public Transport"
  }
];

// Initialize users and admins database in local storage on first load
export const initLocalStorageData = () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(DEMO_CITIZENS));
  } else {
    try {
      const parsed = JSON.parse(localStorage.getItem('users'));
      if (Array.isArray(parsed)) {
        let changed = false;
        const updated = parsed.map(c => {
          if (c.aadhaar === "123456789012" && !c.address) {
            changed = true;
            return {
              ...c,
              address: "123 MG Road, Pune, Maharashtra - 411001",
              email: "citizen@example.com"
            };
          }
          return c;
        });
        if (changed) {
          localStorage.setItem('users', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn("Migration correction failed:", e);
    }
  }

  // Always merge demo admin accounts (so dept accounts are available even with old sessions)
  try {
    const stored = localStorage.getItem('admins');
    const existing = stored ? JSON.parse(stored) : [];
    let changed = false;
    const merged = [...existing];
    for (const demo of DEMO_ADMINS) {
      const found = merged.find(
        a => a.username.toLowerCase() === demo.username.toLowerCase()
      );
      if (!found) {
        merged.push(demo);
        changed = true;
      } else {
        // Patch role/department fields if missing on existing record
        if (!found.role || !found.department !== undefined) {
          Object.assign(found, { role: demo.role, department: demo.department });
          changed = true;
        }
      }
    }
    if (changed || !stored) {
      localStorage.setItem('admins', JSON.stringify(merged));
    }
  } catch (e) {
    console.warn("Admin account merge failed:", e);
    localStorage.setItem('admins', JSON.stringify(DEMO_ADMINS));
  }
};

// Retrieve users from local storage
export const getLocalStorageUsers = () => {
  initLocalStorageData();
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
};

// Retrieve admins from local storage
export const getLocalStorageAdmins = () => {
  initLocalStorageData();
  const admins = localStorage.getItem('admins');
  return admins ? JSON.parse(admins) : [];
};

// Save a citizen user to simulated DB (optional utility)
export const saveLocalStorageUser = (user) => {
  const users = getLocalStorageUsers();
  if (!users.some(u => u.aadhaar === user.aadhaar)) {
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }
};

// Current Session Managers
export const getCurrentSessionUser = () => {
  const session = localStorage.getItem('currentUser');
  return session ? JSON.parse(session) : null;
};

export const setCurrentSessionUser = (sessionData) => {
  localStorage.setItem('currentUser', JSON.stringify(sessionData));
};

export const removeCurrentSessionUser = () => {
  localStorage.removeItem('currentUser');
};
