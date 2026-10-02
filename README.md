# PES Tournament

Professional, mobile-first PES/eFootball tournament registration website.

## Current features

### Public registration
- Full name
- 10-digit phone validation
- Email validation
- PES ID
- Duplicate email/PES ID protection
- Unique registration ID
- Registration success state
- Responsive professional UI

### Admin dashboard
- Total registrations
- Registered / paid / pending counts
- Search by player, PES ID, phone or email
- Status filter
- Registration table
- CSV export
- Local-data reset
- Mobile responsive dashboard

### Backend-ready structure
- `backend/schema.sql` defines the registrations and tournament settings data model.
- Payment is intentionally **not implemented yet**.
- The current static version stores test registrations in browser localStorage only.

## Important production step

GitHub Pages can host the frontend, but it should not be treated as a secure database or secure admin authentication layer.

Before public tournament use, connect a real backend/database and secure admin authentication. The SQL schema in `backend/schema.sql` is prepared for that connection.

Payment can then be added independently with a verified server-side payment flow. Do not trust a browser-only “payment successful” button.

## Project structure

```
/
├── index.html
├── style.css
├── script.js
├── admin/
│   ├── index.html
│   └── admin.js
└── backend/
    └── schema.sql
```
