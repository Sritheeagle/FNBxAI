# Subject Deletion Troubleshooting Guide

## Current Status
Subject deletion is not working as expected. Here's what we need to verify:

## Testing Steps

### 1. Open Browser Console (F12)
Press F12 in your browser and go to the Console tab.

### 2. Try to Delete a Subject
Click the delete button on any subject and watch for these console messages:

**Expected Console Output:**
```
[Delete] Deleting subject from database: { name: "Subject Name", id: "..." }
[Delete] Backend response: { message: "Course deleted" }
[Delete] Subject deleted successfully
[Delete] Refreshing all data...
```

### 3. Check for Errors

**If you see:**
- `[Delete] Missing ID:` → The subject doesn't have a database ID (it's a static template subject)
- `DELETE /api/courses/undefined failed` → ID is undefined
- `DELETE /api/courses/static-xxx failed` → Trying to delete a template subject
- `404 Not Found` → Subject already deleted or doesn't exist in database

### 4. Identify the Subject Type

**Static Template Subjects:**
- Come from `branchData.js` (hardcoded)
- Have IDs like `static-CSE-101` or no ID
- Show with dashed borders in the UI
- **Cannot be deleted** (they're templates, not database records)

**Dynamic Database Subjects:**
- Added by admins through the "ADD SUBJECT" button
- Have MongoDB IDs like `507f1f77bcf86cd799439011`
- Show with solid borders
- **Can be deleted**

## Solutions

### Option 1: Hide Static Subjects from Delete Button
Only show the delete button on dynamic subjects (those with real database IDs).

### Option 2: Create Database Override
When "deleting" a static subject, create a database record with `isHidden: true` to hide it.

### Option 3: Clear Communication
Show a message:  "This is a curriculum template subject and cannot be deleted. Add it to your curriculum first to manage it."

## Quick Test

1. Try deleting a subject you **added yourself** (not from the default curriculum)  
2. Check if that works  
3. Report back what you see in the console  

## What to Send Me

Please copy and paste from your browser console:
1. Any messages starting with `[Delete]`
2. Any error messages in red
3. The network request details (Network tab → look for DELETE request)

This will help me fix the exact issue!
