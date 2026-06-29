# CelerityForge

**CelerityForge** is a robust, full-stack Inventory & Staff Management System designed to streamline technical operations, asset tracking, and order fulfillment. Built with a high-performance FastAPI backend and a dynamic React frontend, it features role-based access control, interactive analytics, and seamless payment processing.

## Video Demo

<video src="https://github.com/user-attachments/assets/2ed01202-9e70-4685-9ba8-a4a036aa63f0" width="100%" controls autoplay muted loop>
  Your browser does not support the video tag.
</video>

## Key Features

- **Role-Based Access Control (RBAC):** Distinct workflows and permissions for **Admins** (full system control, reassignment, global analytics) and **Technicians** (task execution, localized order management).
- **Interactive Dashboards:** Real-time data visualization using `Recharts`, featuring monthly revenue bar charts, categorical sales pie charts, and top-performing product lists.
- **Advanced Order Management:** Complete lifecycle tracking from creation to fulfillment. Includes dynamic workflow assignments, internal notes, PDF receipt generation, and status monitoring.
- **Immutable Order History:** Utilizes PostgreSQL `JSONB` fields to create immutable snapshots of customers, assignees, and items at the time of purchase, preventing historical data mutation when inventory changes.
- **Integrated Payment Gateway:** Secure checkout flow powered by **Razorpay**.
- **Smart Inventory Tracking:** Real-time asset valuation, stock level monitoring, and automated "Low Stock" / "Out of Stock" indicators.

## Database Schema

<p align="center">
  <img src="https://github.com/user-attachments/assets/a845e265-7913-4104-b240-537ca8b54c90" alt="CelerityForge-Database-Schema" width="900">
</p>

## Tech Stack

### Frontend

- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **Icons & Notifications:** React Icons, React Hot Toast

### Backend

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Media Storage:** Cloudinary
- **Payment Gateway:** Razorpay

### Development

- Docker & Docker Compose
- Adminer

## Prerequisites

Before you begin, ensure the following are installed on your system:

- Git
- Node.js (v18 or later)
- Python (3.10 or later)
- Docker Desktop (or Docker Engine + Docker Compose)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/celerityforge.git
cd celerityforge
```

### 2. Start PostgreSQL using Docker

The project includes a `docker-compose.yaml` file inside the `backend/` directory that provisions:

- PostgreSQL 16
- Adminer

Navigate to the backend directory:

```bash
cd backend
```

Start the services:

```bash
docker compose up -d
```

Verify that the containers are running:

```bash
docker compose ps
```

The following services will be available:

| Service | URL / Port |
|----------|------------|
| PostgreSQL | localhost:5432 |
| Adminer | http://localhost:8080 |

To stop the services:

```bash
docker compose down
```

To stop the services and remove all database data:

```bash
docker compose down -v
```

### 3. Backend Setup

Create and activate a virtual environment:

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory:

```env
JWT_SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=your_folder_name

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=celerityforge_db

RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

```
http://localhost:8000
```

### 4. Frontend Setup

Open a new terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=your_test_key_id
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at:

```
http://localhost:5173
```

## Docker Commands

| Command | Description |
|----------|-------------|
| `docker compose up -d` | Start PostgreSQL and Adminer |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop services and remove database volume |
| `docker compose ps` | List running containers |
| `docker compose logs -f` | View container logs |
| `docker compose restart` | Restart all services |

## Adminer Login

Open:

```
http://localhost:8080
```

If using the provided `docker-compose.yaml`, use:

| Field | Value |
|--------|-------|
| System | PostgreSQL |
| Server | db |
| Username | postgres |
| Password | postgres |
| Database | celerityforge_db |

If you modified the values in your Docker environment variables, use those instead.
