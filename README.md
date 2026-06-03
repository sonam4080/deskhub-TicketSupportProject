# DeskHub — Support Ticket Dashboard

A vanilla JavaScript, ES-module based support ticketing application built for the JavaScript training program capstone.

## Features
- **Authentication**: Fake login system with session persistence.
- **Ticket Management**: Full CRUD operations for support tickets.
- **Search & Filter**: Debounced search and dynamic filtering by status and priority.
- **Pagination**: Efficient handling of large ticket lists using `json-server` pagination.
- **Detail View**: Parallel fetching of ticket data and comments.
- **Comments**: Real-time internal notes and customer responses.

## Tech Stack
- **Frontend**: Vanilla JS (ES Modules), HTML5, CSS3.
- **Backend**: `json-server` for REST API simulation.
- **Utilities**: Custom fetch wrapper, debouncing, and date formatting.

## Setup Instructions
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   - API runs at `http://localhost:3001`
   - UI runs at `http://localhost:8080`

## Credentials
- **Email**: `priya@deskhub.in`
- **Password**: `demo123`

## Project Structure
- `docs/`: Static assets and HTML files for GitHub Pages.
- `docs/src/api/`: API client and service wrappers.
- `docs/src/modules/`: UI logic and module-specific code.
- `docs/src/utils/`: Helper functions and shared utilities.

## GitHub Pages
Set GitHub Pages source to `main` branch and `docs/` folder.
