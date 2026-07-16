Here's a hackathon-focused prompt that builds on your existing system without overengineering it.

---

# Prompt for Antigravity

Implement **Role-Based Department Dashboards** for our **AI-Powered Grievance Lodging & Tracking System**.

The goal is to allow different government departments to log in and view **only the complaints assigned to their department**, while the existing **Super Admin Dashboard** continues to display complaints from **all departments**.

This is for an **8-hour hackathon**, so implement a clean, maintainable solution using the existing authentication and complaint system.

---

# Existing System

The following features are already implemented and **must not be changed**:

* User Authentication
* Admin Dashboard
* AI Complaint Classification
* AI Department Routing
* Complaint Tracking
* Priority Engine
* Notifications
* SLA Monitoring
* MongoDB Database

The AI already assigns every complaint to a department.

Reuse this existing department field.

---

# Objective

Implement multiple department-specific dashboards.

Example logins:

```
admin@roads.com

admin@electricity.com

admin@water.com

admin@garbage.com

admin@health.com

admin@transport.com
```

Each department admin should only see complaints assigned to **their own department**.

The existing

```
admin@admin.com
```

(or current Super Admin account)

should continue to see **every complaint from every department**.

---

# Roles

Introduce two admin roles.

## 1. Super Admin

Permissions:

* View all complaints
* View all departments
* View analytics for entire city
* Access Heatmap
* Update complaint status
* Reassign complaints
* View all users

No restrictions.

---

## 2. Department Admin

Permissions:

* View only complaints belonging to their department
* Update complaint status
* View complaint details
* View department statistics
* View department heatmap
* View only department notifications

Department admins cannot access complaints assigned to other departments.

---

# Department Mapping

Reuse the existing AI-generated department field.

Example:

```
Complaint

↓

Department

↓

Roads Department
```

should automatically appear inside

```
admin@roads.com
```

Similarly,

```
Electricity Department

↓

admin@electricity.com
```

```
Water Supply Department

↓

admin@water.com
```

etc.

---

# Authentication

Extend the existing authentication.

Each admin account should have

```
role

department
```

Example

```json
{
    "email":"admin@roads.com",
    "role":"department_admin",
    "department":"Roads Department"
}
```

Super Admin

```json
{
    "email":"admin@admin.com",
    "role":"super_admin"
}
```

---

# Backend

Modify the complaint API.

If

```
role == super_admin
```

Return

```
all complaints
```

If

```
role == department_admin
```

Return only

```
complaints where

complaint.department == admin.department
```

This filtering should happen on the backend, not only on the frontend.

---

# Dashboard Behaviour

## Super Admin Dashboard

Continue using the existing dashboard.

Display

```
Roads

Electricity

Water

Garbage

Health

Transport

etc.
```

No changes except adding department statistics.

---

## Department Dashboard

When a department admin logs in,

the dashboard should automatically display only:

* Total complaints
* Pending complaints
* In Progress complaints
* Resolved complaints
* Critical complaints

for that department only.

No data from other departments should be visible.

---

# Dashboard Title

Display

```
Roads Department Dashboard
```

or

```
Electricity Department Dashboard
```

depending on the logged-in user.

---

# Analytics

Department dashboards should calculate analytics only for their department.

Example

Roads Dashboard

```
Total Complaints

145

Pending

32

Resolved

91

Critical

7

Average Priority

High
```

Electricity dashboard should calculate only electricity complaints.

---

# Complaint Table

Department admins should only see

```
Complaint ID

Citizen Name

Category

Priority

Status

Created Date
```

for their department.

---

# Heatmap

Reuse the existing Heatmap.

For Super Admin

Show

```
Entire city
```

For Department Admin

Show only complaints belonging to that department.

Example

Roads Department

↓

Heatmap displays only potholes, damaged roads, road block complaints.

Electricity Department

↓

Heatmap displays only streetlight and power complaints.

---

# Notifications

Department admins should receive notifications only for complaints belonging to their department.

---

# Search & Filters

Department dashboards should still support

* Search
* Priority filter
* Status filter
* Date filter

Only within their department.

---

# Sidebar

Super Admin Sidebar

```
Dashboard

Complaints

Analytics

Heatmap

Departments

Users

Settings
```

Department Sidebar

```
Dashboard

Complaints

Analytics

Heatmap

Profile
```

Hide admin-only pages.

---

# Demo Accounts

Create demo accounts for the hackathon.

```
admin@admin.com
Password: admin123

admin@roads.com
Password: admin123

admin@electricity.com
Password: admin123

admin@water.com
Password: admin123

admin@garbage.com
Password: admin123

admin@health.com
Password: admin123

admin@transport.com
Password: admin123
```

These can be seeded automatically if they don't exist.

---

# UI

Maintain the existing Admin Dashboard design.

Do not redesign the UI.

The dashboard should dynamically adapt based on the logged-in user's role and department.

---

# Deliverables

Implement a complete **Role-Based Department Dashboard System** that includes:

* Role-based authentication (`super_admin` and `department_admin`)
* Department-specific admin accounts
* Backend filtering so department admins only receive complaints assigned to their department
* Existing Super Admin dashboard continues to show all complaints across departments
* Department-specific analytics
* Department-specific heatmap
* Department-specific notifications
* Dynamic dashboard titles and statistics
* Seeded demo accounts for each department

**Important:** Reuse the existing authentication, AI department routing, complaint schema, and dashboard components wherever possible. Avoid duplicating pages—use the same dashboard components and render data dynamically based on the logged-in user's role and department. This keeps the implementation clean, modular, and suitable for an 8-hour hackathon demo.
