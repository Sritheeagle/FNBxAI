# Uploads Directory

This directory is **ESSENTIAL** for the application. DO NOT DELETE.

## Contents
- **\students**: Stores individual student data folders.
  - Contains `student_details.json` (Data Backup)
  - Contains `attendance_record.json`
  - Contains `academic_marks.json`
  - Contains Profile Pictures and Personal Uploads
- **\faculty**: Stores faculty specific files.
- **\materials**: Stores course materials (PDFs, Videos) uploaded by Admin.
- **\admin**: Stores admin profile data.

## Note
This folder acts as the physical file storage. While the database (MongoDB) stores the *information*, this folder stores the *actual files*.
Basic data backups are also synced here for safety.
