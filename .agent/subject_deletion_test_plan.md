# Subject Deletion - Complete Test Plan

## Overview
This document provides a comprehensive testing guide to verify that subject deletion works correctly across all dashboards and components.

## Pre-Test Setup
1. **Open Multiple Dashboards:**
   - Browser Tab 1: Admin Dashboard
   - Browser Tab 2: Student Dashboard (different student or same)
   - Browser Tab 3 (Optional): Faculty Dashboard

2. **Open Browser Console (F12)** in all tabs to monitor logs

3. **Note Initial State:**
   - Count how many subjects are visible in Admin Dashboard
   - Note which subjects appear in Student Dashboard semester view
   - Screenshot (optional) for comparison

## Test Cases

### Test Case 1: Basic Subject Deletion
**Steps:**
1. In Admin Dashboard, navigate to **Academic Hub** → **SUBJECTS** tab
2. Select any subject and click the **🗑️ Delete** button
3. Confirm the deletion when prompted

**Expected Results:**
✅ Subject disappears immediately from Admin Dashboard subject list
✅ Alert shows: "✓ Subject '[Name]' has been permanently deleted"
✅ Console shows:
   - `[DELETE COURSE] Starting deletion for ID: xxx`
   - `[DELETE COURSE] Successfully deleted course from database`
   - `[DELETE COURSE] SSE broadcast sent to all clients`

### Test Case 2: Real-Time Student Dashboard Update
**Steps:**
1. Keep Student Dashboard open while performing Test Case 1
2. Observe Student Dashboard immediately after admin deletes subject

**Expected Results:**
✅ Subject disappears from Student Dashboard semester subjects within 1-2 seconds
✅ Console shows:
   - `[StudentDashboard] Course deleted via SSE: xxx`
   - `[StudentDashboard] SSE update received for: courses`
✅ If on "Academic Synopsis" page, subject card disappears
✅ Subject dropdowns update (no deleted subject)

### Test Case 3: Persistence After Refresh
**Steps:**
1. After deleting a subject, refresh both Admin and Student Dashboards
2. Navigate to different sections that show subjects

**Expected Results:**
✅ Deleted subject does NOT reappear after refresh
✅ Admin: Subject not in Academic Hub → SUBJECTS list
✅ Student: Subject not in semester cards
✅ Student: Subject not in "Academic Synopsis" cards
✅ Student: Subject not available in any subject dropdowns

### Test Case 4: Multiple Tab Synchronization
**Steps:**
1. Open Admin Dashboard in 2 separate browser tabs (Tab A and Tab B)
2. In Tab A, delete a subject
3. Observe Tab B without refreshing

**Expected Results:**
✅ Tab B receives SSE update and refreshes subject list automatically
✅ Console in Tab B shows:
   - `[AdminDashboard] SSE: Courses updated, refreshing...`
   - `[AdminDashboard] Fetched X courses from API`
✅ Deleted subject disappears from Tab B within 1-2 seconds

### Test Case 5: Subject-Dependent Components
**Steps:**
1. Before deleting, note subjects in these areas:
   - Student: Semester Notes (Notebooks section)
   - Student: Academic Synopsis (subject cards)
   - Admin: Exam Manager subject dropdowns
   - Admin: Marks Entry subject selection
2. Delete a subject
3. Check all the above areas

**Expected Results:**
✅ **Semester Notes**: Deleted subject removed from notebooks list
✅ **Academic Synopsis**: Subject card no longer displayed
✅ **Admin Exams**: Deleted subject not in dropdown
✅ **Admin Marks**: Deleted subject not selectable

### Test Case 6: Student Overview API
**Steps:**
1. Delete a subject
2. In Student Dashboard, navigate to "Overview" page
3. Check browser console Network tab for `/api/students/[sid]/overview` response

**Expected Results:**
✅ Response JSON does NOT include deleted subject in:
   - `attendance.details`
   - `academics.details`
✅ Console shows no errors related to missing subjects
✅ Only active subjects initialize with empty attendance/marks

### Test Case 7: Deletion of Static Template Subjects
**Steps:**
1. Identify a subject that has a "dashed border" (static template subject)
2. Click delete on this subject
3. Confirm deletion

**Expected Results:**
✅ Alert shows: "✓ Subject '[Name]' has been hidden from all views"
✅ Console shows: `[Delete] Creating hidden override for template subject`
✅ Subject no longer appears in any dashboard
✅ Refresh confirms the subject stays hidden

## Edge Cases

### Edge Case 1: Delete Subject with Existing Attendance Records
**Setup:** Create attendance records for a subject first
**Test:** Delete the subject
**Expected:** Subject deletion succeeds; attendance records remain in database but subject doesn't appear in UI

### Edge Case 2: Delete Subject with Enrolled Students
**Setup:** Students already enrolled with this subject in their semester
**Test:** Delete the subject
**Expected:** Subject removed from all student views; no errors in student dashboards

### Edge Case 3: Network Delay
**Setup:** Use browser DevTools to throttle network to "Slow 3G"
**Test:** Delete a subject
**Expected:** 
- Local state updates immediately
- SSE update when connection allows
- Full refresh within reasonable time
- No duplicate entries or UI glitches

## Verification Checklist

After completing all tests, verify:

- [ ] Admin Dashboard shows correct subject count
- [ ] Student Dashboard has no deleted subjects in any view
- [ ] Console has no errors related to deleted subjects
- [ ] No 404 errors in Network tab for deleted subject data
- [ ] SSE events are being broadcast correctly
- [ ] Multiple tabs/users stay synchronized
- [ ] Page refreshes maintain correct state
- [ ] Subject-dependent features (attendance, marks, notes) work correctly

## Troubleshooting

### If Subject Still Appears:
1. Check browser console for errors
2. Verify backend is running (check terminal)
3. Check if SSE connection is active: Look for SSE logs in console
4. Hard refresh browser (Ctrl+Shift+R)
5. Check if course is actually deleted in MongoDB

### If SSE Not Working:
1. Check backend terminal for SSE messages
2. Check browser console for SSE client connection
3. Verify no firewall blocking SSE connection
4. Check if `/stream` endpoint is accessible

### If Console Shows Errors:
1. Note the exact error message
2. Check if it's a known issue (isHidden field missing, etc.)
3. Check backend logs for detailed stack trace
4. Verify MongoDB connection is active

## Success Criteria

✅ **All test cases pass**
✅ **No console errors** related to deleted subjects
✅ **Real-time synchronization** works across all dashboards
✅ **Persistence verified** after refresh
✅ **No orphaned data** displayed in UI

## Performance Benchmarks

- **Local State Update**: < 100ms (immediate)
- **SSE Broadcast**: < 200ms
- **Full Data Refresh**: < 500ms
- **UI Re-render**: < 300ms
- **Total Time (Delete → All Dashboards Updated)**: < 1 second

## Log Examples

### Successful Deletion Logs:
```
[DELETE COURSE] Starting deletion for ID: 67a123456789
[DELETE COURSE] Found course to delete: { id: '67a123456789', name: 'Web Technologies', code: 'WT' }
[DELETE COURSE] Successfully deleted course from database: Web Technologies
[DELETE COURSE] SSE broadcast sent to all clients
[StudentDashboard] Course deleted via SSE: 67a123456789
[StudentDashboard] SSE update received for: courses
[AdminDashboard] SSE: Courses updated, refreshing...
[AdminDashboard] Fetched 15 courses from API
```

### What NOT to See:
```
❌ Course not found (after deletion UI still tries to fetch it)
❌ Cannot read property 'name' of undefined (deleted subject still referenced)
❌ 404 errors for deleted subject data
❌ Duplicate subjects appearing
```

## Notes
- All logging is temporary for debugging and can be removed in production
- SSE must be enabled for real-time updates to work
- Fallback polling (15s interval) ensures eventual consistency even if SSE fails
