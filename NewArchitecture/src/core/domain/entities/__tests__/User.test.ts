import { User, UserProps, UserRole, UserStatus } from '../User';

describe('User Entity', () => {
  const validUserProps: UserProps = {
    username: 'johndoe',
    email: 'john@example.com',
    passwordHash: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Smith',
    role: UserRole.OPERATOR,
    status: UserStatus.ACTIVE,
    district: 'Central',
    department: 'IT',
    phoneNumber: '998901234567',
    permissions: ['broadcast', 'view_reports'],
  };

  describe('Constructor and Creation', () => {
    it('should create a user with valid props', () => {
      const user = new User(validUserProps);
      
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe(UserRole.OPERATOR);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('should convert username and email to lowercase', () => {
      const props = { ...validUserProps, username: 'JohnDoe', email: 'JOHN@EXAMPLE.COM' };
      const user = new User(props);
      
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
    });

    it('should throw error for short username', () => {
      const props = { ...validUserProps, username: 'ab' };
      
      expect(() => new User(props)).toThrow('Username must be at least 3 characters');
    });

    it('should throw error for invalid email', () => {
      const props = { ...validUserProps, email: 'invalid-email' };
      
      expect(() => new User(props)).toThrow('Invalid email format');
    });

    it('should generate full name correctly', () => {
      const user = new User(validUserProps);
      expect(user.fullName).toBe('John Doe Smith');
      
      const userWithoutMiddle = new User({ ...validUserProps, middleName: undefined });
      expect(userWithoutMiddle.fullName).toBe('John Doe');
    });
  });

  describe('Authentication Methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserProps);
    });

    it('should record successful login', () => {
      user.recordSuccessfulLogin('192.168.1.1');
      
      expect(user.lastLoginIp).toBe('192.168.1.1');
      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('should record failed login attempts', () => {
      user.recordFailedLogin();
      expect(user.failedLoginAttempts).toBe(1);
      
      user.recordFailedLogin();
      expect(user.failedLoginAttempts).toBe(2);
    });

    it('should lock account after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) {
        user.recordFailedLogin();
      }
      
      expect(user.failedLoginAttempts).toBe(5);
      expect(user.status).toBe(UserStatus.SUSPENDED);
      expect(user.lockedUntil).toBeInstanceOf(Date);
      expect(user.isLocked()).toBe(true);
    });

    it('should unlock account', () => {
      for (let i = 0; i < 5; i++) {
        user.recordFailedLogin();
      }
      
      user.unlock();
      
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeUndefined();
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isLocked()).toBe(false);
    });

    it('should update password and reset failed attempts', () => {
      user.recordFailedLogin();
      user.recordFailedLogin();
      
      user.updatePassword('new_hashed_password');
      
      expect(user.passwordHash).toBe('new_hashed_password');
      expect(user.failedLoginAttempts).toBe(0);
    });
  });

  describe('Role and Permission Management', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserProps);
    });

    it('should change user role', () => {
      user.changeRole(UserRole.ADMIN);
      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should check if user is admin', () => {
      expect(user.isAdmin()).toBe(false);
      
      user.changeRole(UserRole.ADMIN);
      expect(user.isAdmin()).toBe(true);
    });

    it('should check if user is district admin', () => {
      expect(user.isDistrictAdmin()).toBe(false);
      
      user.changeRole(UserRole.DISTRICT_ADMIN);
      expect(user.isDistrictAdmin()).toBe(true);
    });

    it('should add permissions', () => {
      user.addPermission('manage_users');
      
      expect(user.permissions).toContain('manage_users');
      expect(user.hasPermission('manage_users')).toBe(true);
    });

    it('should not duplicate permissions', () => {
      user.addPermission('broadcast');
      const initialLength = user.permissions.length;
      
      user.addPermission('broadcast');
      expect(user.permissions.length).toBe(initialLength);
    });

    it('should remove permissions', () => {
      user.removePermission('broadcast');
      
      expect(user.permissions).not.toContain('broadcast');
      expect(user.hasPermission('broadcast')).toBe(false);
    });
  });

  describe('Status Management', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserProps);
    });

    it('should activate user', () => {
      user.changeStatus(UserStatus.INACTIVE);
      user.activate();
      
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should deactivate user', () => {
      user.deactivate();
      
      expect(user.status).toBe(UserStatus.INACTIVE);
    });

    it('should suspend user', () => {
      const until = new Date(Date.now() + 86400000); // 24 hours
      user.suspend(until);
      
      expect(user.status).toBe(UserStatus.SUSPENDED);
      expect(user.lockedUntil).toEqual(until);
    });
  });

  describe('District Access Control', () => {
    it('should allow admin access to any district', () => {
      const admin = new User({ ...validUserProps, role: UserRole.ADMIN });
      
      expect(admin.canAccessDistrict('Central')).toBe(true);
      expect(admin.canAccessDistrict('North')).toBe(true);
    });

    it('should allow district admin access to their district only', () => {
      const districtAdmin = new User({
        ...validUserProps,
        role: UserRole.DISTRICT_ADMIN,
        district: 'Central',
      });
      
      expect(districtAdmin.canAccessDistrict('Central')).toBe(true);
      expect(districtAdmin.canAccessDistrict('North')).toBe(false);
    });

    it('should deny regular user district access', () => {
      const user = new User(validUserProps);
      
      expect(user.canAccessDistrict('Central')).toBe(false);
    });
  });

  describe('Business Rules', () => {
    it('should check if user can manage users', () => {
      const admin = new User({ ...validUserProps, role: UserRole.ADMIN });
      expect(admin.canManageUsers()).toBe(true);
      
      // Create operator without manage_users permission
      const operatorProps = { ...validUserProps, permissions: ['broadcast'] };
      const operator = new User(operatorProps);
      expect(operator.canManageUsers()).toBe(false);
      
      operator.addPermission('manage_users');
      expect(operator.canManageUsers()).toBe(true);
    });

    it('should check if user can broadcast', () => {
      const viewer = new User({ ...validUserProps, role: UserRole.VIEWER });
      expect(viewer.canBroadcast()).toBe(false);
      
      viewer.addPermission('broadcast');
      expect(viewer.canBroadcast()).toBe(true);
      
      const operator = new User(validUserProps);
      expect(operator.canBroadcast()).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should convert to plain object', () => {
      // Use specific user props for this test
      const testProps = {
        ...validUserProps,
        permissions: ['broadcast', 'view_reports']
      };
      const user = new User(testProps);
      const obj = user.toObject();
      
      expect(obj).toEqual(expect.objectContaining({
        username: 'johndoe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.OPERATOR,
        status: UserStatus.ACTIVE,
      }));
      
      expect(obj.permissions).toEqual(['broadcast', 'view_reports']);
      expect(obj.createdAt).toBeInstanceOf(Date);
    });
  });
});