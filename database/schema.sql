-- =============================================================================
-- Cloud-Based Student Assignment Submission & Evaluation Portal
-- Database Initialization Script (MySQL 8.0+)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `assignment_portal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `assignment_portal`;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role` ENUM('student', 'faculty') NOT NULL DEFAULT 'student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Assignments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `due_date` DATETIME NOT NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_assignments_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  INDEX `idx_assignments_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Submissions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `file_url` VARCHAR(1024) NOT NULL,
  `file_key` VARCHAR(512) NOT NULL,
  `marks` DECIMAL(5, 2) NULL DEFAULT NULL,
  `status` ENUM('submitted', 'evaluated', 'needs_revision') NOT NULL DEFAULT 'submitted',
  `feedback` TEXT NULL DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `evaluated_at` DATETIME NULL DEFAULT NULL,
  CONSTRAINT `fk_submissions_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_submissions_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX `idx_submissions_assignment` (`assignment_id`),
  INDEX `idx_submissions_student` (`student_id`),
  INDEX `idx_submissions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Initial Seed Data for Testing & Demo
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `role`) VALUES
  (1, 'Dr. Aris Thorne', 'faculty.thorne@university.edu', 'faculty'),
  (2, 'Prof. Evelyn Vance', 'faculty.vance@university.edu', 'faculty'),
  (3, 'Alex Mercer', 'student.mercer@university.edu', 'student'),
  (4, 'Maya Lin', 'student.lin@university.edu', 'student'),
  (5, 'Jordan Lee', 'student.lee@university.edu', 'student')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `assignments` (`id`, `title`, `description`, `due_date`, `created_by`) VALUES
  (1, 'Lab 1: AWS VPC & Multi-Tier Architecture Design', 
   'Design and implement a highly available, fault-tolerant 3-tier VPC with public and private subnets, NAT Gateway, and security group configurations. Submit your architectural diagram and implementation report as a PDF.', 
   DATE_ADD(NOW(), INTERVAL 7 DAY), 1),
  (2, 'Lab 2: Serverless Event-Driven Pipeline using S3 & Lambda', 
   'Build a serverless image processing pipeline triggered by S3 ObjectCreated events. Include SAM or Terraform template definitions, Lambda handler code, and test execution logs.', 
   DATE_ADD(NOW(), INTERVAL 14 DAY), 1),
  (3, 'Lab 3: Kubernetes Microservices Deployment on AWS EKS', 
   'Containerize a multi-service web application, create Helm charts, configure Ingress ALB controllers, and demonstrate horizontal pod autoscaling (HPA) under synthetic load.', 
   DATE_ADD(NOW(), INTERVAL 21 DAY), 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `submissions` (`id`, `assignment_id`, `student_id`, `file_url`, `file_key`, `marks`, `status`, `feedback`, `submitted_at`, `evaluated_at`) VALUES
  (1, 1, 3, 
   'https://assignment-portal-submissions-prod.s3.amazonaws.com/submissions/student-3/lab1-architecture-alex-mercer.pdf', 
   'submissions/student-3/lab1-architecture-alex-mercer.pdf', 
   92.50, 'evaluated', 
   'Excellent VPC subnet partitioning and CIDR block selection. Security group rules follow least-privilege principles.', 
   DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
  (2, 1, 4, 
   'https://assignment-portal-submissions-prod.s3.amazonaws.com/submissions/student-4/lab1-vpc-maya-lin.pdf', 
   'submissions/student-4/lab1-vpc-maya-lin.pdf', 
   NULL, 'submitted', 
   NULL, 
   DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
  (3, 2, 5, 
   'https://assignment-portal-submissions-prod.s3.amazonaws.com/submissions/student-5/lab2-serverless-pipeline-jordan.pdf', 
   'submissions/student-5/lab2-serverless-pipeline-jordan.pdf', 
   NULL, 'needs_revision', 
   'S3 bucket policy lacks KMS SSE-S3 encryption requirements. Please update IAM role permissions and resubmit.', 
   DATE_SUB(NOW(), INTERVAL 6 HOUR), NOW())
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);
