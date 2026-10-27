# Cloud-Based Student Assignment Submission & Evaluation Portal

A production-grade, secure, and scalable cloud application built with **Node.js/Express**, **React with Tailwind CSS**, **MySQL**, and **AWS SDK v3**. Designed to run on **AWS EC2** with IAM role-based authentication, dynamic database credential resolution via **AWS Systems Manager (SSM) Parameter Store**, and secure direct file handling via **Amazon S3 Pre-signed URLs**.

---

## 🏛️ Cloud Architecture Overview

```
                                       +----------------------------------------+
                                       |          Amazon Web Services           |
                                       |                                        |
  +------------------+                 |   +--------------------------------+   |
  |  React Frontend  |                 |   | AWS Systems Manager (SSM)      |   |
  |  (Tailwind CSS)  |                 |   | Parameter Store:               |   |
  +--------+---------+                 |   |  - /app/db_host                |   |
           |                           |   |  - /app/db_user                |   |
           | 1. Request Pre-signed URL |   |  - /app/db_password (Secure)   |   |
           v                           |   +---------------+----------------+   |
  +------------------+                 |                   ^                    |
  |  Express API     | ----------------+--- Dynamic Fetch -+                    |
  |  (EC2 / ALB)     | (IAM Role / No hardcoded creds)     |                    |
  +--------+---------+                                     |                    |
           |                           +-------------------+----------------+   |
           | 3. Insert Record          | Amazon RDS / MySQL Database        |   |
           +-------------------------> |  - Users (Students & Faculty)      |   |
                                       |  - Assignments                     |   |
                                       |  - Submissions (file_url, marks)   |   |
                                       +------------------------------------+   |
  +------------------+                                                          |
  | Direct Upload    | 2. Encrypted Client-Side PUT via Pre-signed URL          |
  | & Secure Download+--------------------------------------------------------> |
  | (Browser)        | Amazon S3 Bucket (Submissions / AES-256)                 |
  +------------------+----------------------------------------------------------+
```

### Key Security & Engineering Highlights:
- **Zero Hardcoded Secrets**: MySQL host, user, and encrypted password are dynamically fetched from **AWS Systems Manager Parameter Store** at startup.
- **IAM Instance Profile Chain**: Authentication on EC2 utilizes the AWS SDK v3 Default Credential Provider Chain without requiring static AWS API keys in code or configuration files.
- **Offloaded S3 Pre-signed Uploads**: Student PDF files are uploaded directly from the browser to Amazon S3 using temporary, cryptographically signed PUT URLs, bypassing the EC2 instance network bottleneck.
- **Secure File Downloads**: Faculty members access and evaluate student submissions through time-limited pre-signed GET URLs, ensuring the S3 bucket remains strictly private.
- **Minimal, High-Readability UI**: Focuses on clarity, accessible status indicators, low cognitive load, and frictionless role switching between Students and Faculty.

---

## 📁 Repository Structure

```
.
├── database/
│   └── schema.sql                  # MySQL database initialization script with seed data
├── backend/
│   ├── .env.example                # Backend environment configuration
│   ├── package.json
│   ├── server.js                   # Express server, health check & lifecycle management
│   ├── config/
│   │   ├── ssm.js                  # Dynamic AWS SSM Parameter Store credential loader
│   │   └── db.js                   # MySQL connection pool with SSM integration
│   ├── services/
│   │   └── s3Service.js            # AWS SDK v3 S3 pre-signed upload & download generator
│   └── routes/
│       ├── assignments.js          # Assignments endpoints (GET, POST)
│       ├── submissions.js          # Submissions & faculty evaluation endpoints
│       ├── s3.js                   # S3 pre-signed URL endpoints
│       └── users.js                # Personas endpoint for testing
├── frontend/
│   ├── .env.example                # Frontend environment configuration
│   ├── package.json
│   ├── vite.config.js              # Vite bundler & reverse proxy config
│   ├── tailwind.config.js          # Tailwind CSS typography & color tokens
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # App shell with role switching & cloud footer
│       ├── api.js                  # Axios/Fetch API client & S3 direct uploader
│       ├── index.css               # Typography and scrollbar styling
│       └── components/
│           ├── Navbar.jsx          # Header with active persona switcher & AWS badge
│           ├── StatusBadge.jsx     # Status indicators (Submitted, Graded, Needs Revision)
│           ├── StudentDashboard.jsx# Student tasks, submission status & grades
│           ├── FacultyDashboard.jsx# Submissions table, download & grading drawer
│           ├── SubmitModal.jsx     # Drag-and-drop PDF uploader with S3 progress
│           └── EvaluateModal.jsx   # Faculty evaluation & grading form
└── .env.example                    # Master environment variables template
```

---

## 🛠️ 1. Database Setup (MySQL)

Initialize your MySQL database using the provided script:

```bash
mysql -u root -p < database/schema.sql
```

The script creates:
1. **`users`**: Students and faculty members.
2. **`assignments`**: Course tasks, due dates, and descriptions.
3. **`submissions`**: Student submissions, S3 `file_url`, `file_key`, `marks`, `status`, and `feedback`.
4. **Seed Records**: Pre-configured test accounts (e.g., Alex Mercer, Dr. Aris Thorne) and lab assignments.

---

## ☁️ 2. AWS Cloud Infrastructure Configuration

### A. AWS Systems Manager Parameter Store
Create the database credentials in AWS SSM Parameter Store (using AWS CLI or the AWS Management Console):

```bash
# 1. Database Host (String)
aws ssm put-parameter \
  --name "/app/db_host" \
  --type "String" \
  --value "your-rds-endpoint.c7xxx.us-east-1.rds.amazonaws.com" \
  --overwrite

# 2. Database Username (String)
aws ssm put-parameter \
  --name "/app/db_user" \
  --type "String" \
  --value "portal_admin" \
  --overwrite

# 3. Database Password (SecureString encrypted with AWS KMS)
aws ssm put-parameter \
  --name "/app/db_password" \
  --type "SecureString" \
  --value "YourStrongRdsPassword123!" \
  --overwrite
```

### B. Amazon S3 Bucket & CORS Configuration
Create a private S3 bucket (e.g., `assignment-portal-submissions-prod`) and configure CORS to allow direct PUT requests from your frontend:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### C. EC2 IAM Role Permissions
Attach an IAM Role to your EC2 instance with the following policy permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSMParameterAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/app/*"
    },
    {
      "Sid": "KMSDecryptAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::assignment-portal-submissions-prod",
        "arn:aws:s3:::assignment-portal-submissions-prod/*"
      ]
    }
  ]
}
```

---

## 🚀 3. Running the Backend (Node.js / Express)

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables (`backend/.env`):
   ```ini
   AWS_REGION=us-east-1
   SSM_DB_HOST_PATH=/app/db_host
   SSM_DB_USER_PATH=/app/db_user
   SSM_DB_PASSWORD_PATH=/app/db_password
   S3_BUCKET_NAME=assignment-portal-submissions-prod
   PORT=5000
   ```
   *(For local testing without AWS SSM, you can also define `DB_HOST`, `DB_USER`, and `DB_PASSWORD` directly in `.env` as fallbacks)*.

3. Start the server:
   ```bash
   npm start
   ```
   *Expected output:*
   ```
   [Config] Fetching database credentials (AWS Region: us-east-1)...
   [Config] Database credentials resolved successfully:
    - Host: your-rds-endpoint [via AWS SSM (/app/db_host)]
    - User: portal_admin [via AWS SSM (/app/db_user)]
    - Password: [REDACTED] [via AWS SSM (/app/db_password)]
   [Database] Connected successfully to MySQL database cluster.
   [Server] API is live and listening on http://0.0.0.0:5000
   ```

---

## 💻 4. Running the Frontend (React / Tailwind CSS)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables (`frontend/.env`):
   ```ini
   REACT_APP_API_BASE_URL=http://localhost:5000
   VITE_API_BASE_URL=http://localhost:5000
   ```
   *(For production, set this to your EC2 Public IP or Application Load Balancer DNS name)*.

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Target group health check (EC2/ALB) returning DB & S3 status |
| `GET` | `/api/assignments` | Retrieve all assigned coursework |
| `POST` | `/api/assignments` | Create a new assignment (Faculty only) |
| `POST` | `/api/s3/upload-url` | Generate temporary S3 pre-signed PUT URL for PDF upload |
| `GET` | `/api/s3/download-url` | Generate temporary S3 pre-signed GET URL for secure download |
| `POST` | `/api/submissions` | Create a new submission record with S3 file URL |
| `GET` | `/api/submissions` | Fetch submissions with student info (Faculty dashboard) |
| `GET` | `/api/submissions/student/:id` | Fetch submissions for a specific student |
| `PATCH` | `/api/submissions/:id/evaluate` | Update marks, status (`evaluated`, `needs_revision`), and feedback |
| `GET` | `/api/users` | List students and faculty personas |
