# PharmaTrack IMS: Professional Pharmacy & Intelligence System

PharmaTrack IMS is a Pharmacy Information Management System designed to bridge the gap between internal inventory logistics and external customer health services. Built with a "Clinical-First" philosophy, it combines robust inventory management with advanced AI-driven healthcare tools.

## Key Modules

### Enterprise Control Center (Staff/Pharmacist/Admin)
*   **Intelligent Inventory**: Batch-level tracking with automated shelf/aisle location mapping.
*   **Dynamic POS & Billing**: High-speed sales recording with real-time stock auto-decrement and digital invoice generation.
*   **Clinical Safety Alerts**: Real-time monitoring of expiring batches and low-stock thresholds.
*   **Advanced Analytics**: A premium dashboard providing revenue, profit, and fast-moving medicine insights.
*   **Role-Based Access (RBAC)**: Secure multi-tier permissions for Admins, Pharmacists and Staffs.

### Customer Health Portal (Public)
*   **Public store**: Interactive medicine browsing with stock status.
*   **AI Health Consultant**: Gemini 1.5 Flash integrated symptom-to-medicine advisor.
*   **Drug Interaction Checker**: AI-powered safety module for multi-drug interaction analysis.
*   **WhatsApp Integration**: Instant lead generation for out-of-stock medicine requests.

## Tech Stack
*   **Frontend**: React 19, Vite, Tailwind CSS (Modern Glassmorphism UI).
*   **Backend**: Node.js, Express.
*   **Database**: PostgreSQL.
*   **AI Engine**: Google Gemini 1.5 & Groq Llama 3 Performance Tiers.
*   **Communication**: GMail SMTP for automated alerts.

## Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   PostgreSQL (Port 5433 recommended)

### 2. Backend Setup
```bash
cd pharmatrack-backend
npm install
# Configure your .env file with DB and AI keys
node src/app.js
```

### 3. Frontend Setup
```bash
cd pharmatrack-frontend
npm install
npm run dev
```

## Project Structure
*   `pharmatrack-backend/`: API services, clinical logic, and AI integration.
*   `pharmatrack-frontend/`: High-end UI components and customer portal.


## License
This project is developed for the **Final Year Project (FYP)** submission. All rights reserved.
