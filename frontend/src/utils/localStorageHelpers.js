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

const DEMO_ADMINS = [
  {
    username: "admin",
    password: "admin123",
    name: "System Administrator"
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

  if (!localStorage.getItem('admins')) {
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
