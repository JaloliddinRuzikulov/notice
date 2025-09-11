# District-Based Access Control System

## Overview
The system now supports district-based access control for users. Users can be restricted to view and manage data only from specific districts.

## Features

### 1. User Model Enhancement
- Added `allowedDistricts` field to user model
- Special value `'all'` grants access to all districts
- Array of district IDs for specific district access

### 2. Authentication Updates
- User's allowed districts are stored in session on login
- Admin users automatically get access to all districts

### 3. Middleware Functions
- `checkDistrictAccess()` - Validates district access for requests
- `filterByDistrictAccess()` - Filters data based on user's allowed districts

### 4. Route Protection
- Employee routes now check district access
- Users can only view/edit employees from their allowed districts
- Broadcasts and groups are filtered by employee districts

## Implementation

### Backend Changes

1. **User Model** (`/routes/users.js`)
   ```javascript
   {
     id: "user123",
     username: "john",
     name: "John Doe",
     role: "user",
     allowedDistricts: ["district1", "district2"], // or ["all"]
     permissions: {...}
   }
   ```

2. **Auth Middleware** (`/middleware/auth.js`)
   - Added `checkDistrictAccess()` function
   - Added `filterByDistrictAccess()` function
   - Checks user's district permissions on each request

3. **Employee Routes** (`/routes/employees.js`)
   - GET /api/employees - Returns only employees from allowed districts
   - GET /api/employees/:id - Checks district access before returning
   - POST/PUT/DELETE - Validates district access before modifications

### Frontend Implementation

1. **User Management UI** (`/views/user-management.ejs`)
   - District selection checkboxes
   - "All districts" option
   - Visual indication of district access

2. **JavaScript Filtering** (`/public/js/employees-district-filter.js`)
   - Client-side filtering for better UX
   - District dropdown filtering
   - Validation before creating/editing

## Usage

### Assigning Districts to Users

1. Navigate to Users page (/users)
2. Create new user or edit existing
3. Select allowed districts:
   - Check "Barcha tumanlar" for all districts
   - Or select specific districts
4. Save user

### District Access Rules

1. **Admin Role**
   - Always has access to all districts
   - Can assign any district to any user

2. **User Role**
   - Can only access assigned districts
   - Cannot view/edit data from other districts
   - Phonebook module is exempt from district restrictions

3. **Special Cases**
   - Employees without district assignment are visible to all
   - Empty groups are visible to all
   - Broadcasts without employees are visible to all

## API Examples

### Check User's District Access
```javascript
// In route handler
router.get('/api/employees', checkDistrictAccess(), (req, res) => {
    // req.userCanAccessAllDistricts - boolean
    // req.userAllowedDistricts - array of district IDs
});
```

### Filter Data by District
```javascript
const { filterEmployeesByDistrict } = require('../lib/district-filter');

const allEmployees = await getEmployees();
const filteredEmployees = filterEmployeesByDistrict(
    allEmployees, 
    req.userAllowedDistricts, 
    req.userCanAccessAllDistricts
);
```

## Security Considerations

1. District access is enforced at API level
2. Frontend filtering is for UX only
3. Session-based authentication required
4. Admin override for all districts

## Testing

1. Create test user with specific districts
2. Login as test user
3. Verify:
   - Only assigned district employees visible
   - Cannot create employees in other districts
   - Cannot edit/delete other district employees
   - Reports show only relevant data