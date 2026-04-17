# Clear Corrupted AI Reports Data

If you're getting errors about "Objects are not valid as a React child", run this in your browser console:

```javascript
// Clear corrupted allocation reports
localStorage.removeItem('allocx_allocation_reports');
console.log('✅ Cleared allocation reports data. Refresh the page.');
```

Then refresh the page (F5 or Cmd+R).

## Alternative: Use the UI

1. Go to `/dashboard/ai-reports`
2. Click **"Clear All Reports"** button
3. Page will refresh automatically with clean data
