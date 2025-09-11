# Database Migration Plan for Multi-User System

## Current Issues:
- JSON files are not suitable for concurrent access
- No transaction support
- No data integrity
- District-based permissions not properly implemented

## Proposed Solution: SQLite Database

### Why SQLite?
- Built-in Node.js support
- No separate database server needed
- ACID compliant (transactions)
- Handles concurrent users well
- Easy to deploy

### Database Schema:

```sql
-- Districts table
CREATE TABLE districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Departments table  
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    district_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- Employees table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    rank TEXT,
    department_id INTEGER,
    phone_number TEXT NOT NULL,
    service_phone TEXT,
    district_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT 0,
    created_by INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Users table with district permissions
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- User district permissions
CREATE TABLE user_districts (
    user_id INTEGER,
    district_id INTEGER,
    PRIMARY KEY (user_id, district_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- Groups table
CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    district_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Employee groups relationship
CREATE TABLE employee_groups (
    employee_id INTEGER,
    group_id INTEGER,
    PRIMARY KEY (employee_id, group_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### Implementation Steps:

1. **Install SQLite dependencies**
```bash
npm install sqlite3 sqlite
```

2. **Create database service**
3. **Migrate existing data**
4. **Update all CRUD operations**
5. **Add proper transaction handling**
6. **Implement district-based access control**

### Benefits:
- Concurrent user support (15-20+ users)
- Data integrity
- Backup/restore capability
- Query performance
- Audit trail support