AI-Powered Grievance Lodging & Tracking System: Implemented Features
This document provides a detailed breakdown of all components and features implemented in the grievance lodging and tracking system, spanning AI routing automation, priority analysis, user dashboards, backend API databases, and the completed complaint lifecycle.

🚀 1. AI-Powered Grievance Routing (Ollama Pipeline)
Automatic Department Routing: Grievances are automatically analyzed and assigned to the correct administrative body (e.g., Roads and Drainage, Water Supply Department, Electricity Department, etc.) based on natural language analysis of the description.
Intelligent Classification: Categorizes complaints into structured sub-categories (e.g., Water Leakage, Pothole, Street Light dark zone, Garbage accumulation).
Confidence Metrics: Generates confidence scores and lists extracted keyword triggers behind the routing choice.
Vision-Based Evidence Audit: Supports multimodal verification to analyze uploaded complaint photos (e.g., confirming if an image actually displays a water leak or pothole corresponding to the citizen's text description) with a match verdict.
📊 2. Dynamic Priority Engine
Multi-Factor Prioritization Formula: Calculates a real-time priority score (0–100) and priority level (Low, Medium, High, Critical) based on the following weighted variables:
Safety Risk (30 pts max): Elevates score based on safety hazards flagged by the AI.
Public Impact (20 pts max): Scores the extent of public disruption.
Essential Service Disruption (20 pts max): Detects if the grievance cuts off critical resources (water, power, transit).
Urgency (10 pts max): Standard urgency rating.
Proximity Keyword Match (5 pts max): Matches key keywords (e.g., hospital, school, college, metro station) to prioritize critical public zones.
SLA Escalation Boost (+20 pts): Applies an automatic boost to breached tickets.
Duplicate Detection (10 pts max): Increases priority score by +5 points per identical complaint category reported in the same local neighborhood to highlight community-wide issues.
Time-Pending Weight (5 pts max): Adds +1 point for each day the ticket remains unresolved.
Priority Reasons: Displays a human-readable justification of the priority rating.
🔔 3. Citizen Notification Center
In-App Alerts Inbox: A scrollable Alerts Tray integrated into the Citizen Dashboard profile pane featuring dynamic, animated unread badges.
Lifecycle Notifications: Triggers in-app alerts whenever a ticket status transitions (Assigned ➔ In Progress ➔ Resolved ➔ Reopened ➔ Closed).
Simulated Channels: Logs simulated SMS/Email alert dispatches to the console terminal to verify out-of-band communication:
[LOCAL SMS] To +91 9876543210: "Your grievance Ticket #CMP-0001 status has been updated to 'In Progress'"
[LOCAL Email] To citizen_9876543210@gmail.com: ...
🤝 4. Resolution Confirmation Feedback Loop
Citizen Review Panels: When a ticket is marked Resolved by administrators, the citizen is notified and can choose to:
Confirm Resolution: Moves the ticket status to the final state (Closed) and prompts the user for feedback.
Reopen Grievance: Moves the status back to In Progress, resets SLA escalation flags, and logs a simulated emergency dispatch alert to the assigned officer.
Star Ratings & Feedback Logs: Confirmed resolutions collect a 1–5 star satisfaction rating and optional text comments, saved directly to the database.
Admin Reviews: Closed satisfaction ratings and feedback notes are displayed inside the admin detailed inspection panel.
⏱️ 5. SLA-Based Auto Escalation
Standard Service Agreements: Defines strict resolution timelines based on priority levels:
Critical ➔ 24 Hours
High ➔ 3 Days (72 Hours)
Medium ➔ 7 Days (168 Hours)
Low ➔ 14 Days (336 Hours)
Real-time Expiry Evaluator: Unresolved complaints in Assigned or In Progress states that exceed these limits are automatically marked as is_escalated = True.
Supervisor Notifications: Triggers supervisor and citizen alerts, boosts priority scores (+20 pts), and marks escalated tickets with glowing red warnings inside the admin dashboard.
💻 6. Citizen & Administrator Dashboards
Citizen Submission Portal: Interactive complaint form with:
Leaflet Map location picker centered on Pune, Maharashtra.
Image upload portal for attachments.
AI classification predictions feedback.
Citizen Track Grievance Panel: Interactive step timeline showing historical transitions, assignment details, SLA warnings, and verification forms.
Admin Dispatch Panel:
Full list panel with search queries, status filters, and sorting.
SLA Breach highlight tags.
Detailed view rendering citizen details, maps, description, verification reviews, and manual overrides.
Action operations pane to update status, route category departments, or re-run AI classifiers.
🔌 7. FastAPI Python Backend Integration
FastAPI & SQLAlchemy Models: Fully structured relational backend storing records inside a MySQL server database instance.
Self-Healing Schema Migrations: Detects missing columns (e.g., is_escalated, rating, feedback, assigned_officer) and executes dynamic SQL migrations at boot time.
Database Seeder: Automatically populates mock municipal grievances mapped across several city zones when first booted on an empty database.
REST API Router: Exposes endpoints for complaint submission (supporting file uploads), status patching, AI classifier reruns, and analytical queries.
🛡️ 8. Role-Based Administration & Department Alerts
Dynamic Role Authorization: Differentiates dashboard tabs depending on user login:
Super Admin: Grievance List, Analytics, Heatmap, Departments, Users, Settings.
Department Admin: Grievance List, Analytics, Heatmap, My Profile.
Departmental Data Isolation: Filters complaints list, Leaflet Heatmap pin coordinates, and analytical trends to only show records relevant to a Department Admin's assigned branch.
Live Admin Notification Bell: Integrates a responsive, real-time alert bell tray in the admin dashboard header. Shows department-specific notifications that update whenever status changes.
Department View Blocks: Created beautiful, data-complete components to display registered municipal users, settings thresholds, department leads, and assigned inspector profile details.
💾 9. Standalone & Offline Support
Local Storage Fallbacks: Complete JS replication of notifications, priority score calculations, and SLA auto-escalation inside local fallback caches. The system functions identically in offline/standalone client modes!
State Optimization & Syncing: Automatically maps incoming database payloads to camelCase schemas and updates local storage arrays to keep client-side representations synchronized.