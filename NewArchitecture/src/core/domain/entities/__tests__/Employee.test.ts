import { Employee, EmployeeProps } from '../Employee';

describe('Employee Entity', () => {
  const validEmployeeProps: EmployeeProps = {
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Smith',
    phoneNumber: '998901234567',
    additionalPhone: '998907654321',
    department: 'IT Department',
    district: 'Central District',
    position: 'Senior Developer',
    rank: 'Captain',
    notes: 'Test notes',
    photoUrl: 'https://example.com/photo.jpg',
    isActive: true,
  };

  describe('Constructor and Creation', () => {
    it('should create an employee with valid props', () => {
      const employee = new Employee(validEmployeeProps);
      
      expect(employee.firstName).toBe('John');
      expect(employee.lastName).toBe('Doe');
      expect(employee.middleName).toBe('Smith');
      expect(employee.phoneNumber).toBe('998901234567');
      expect(employee.additionalPhone).toBe('998907654321');
      expect(employee.department).toBe('IT Department');
      expect(employee.district).toBe('Central District');
      expect(employee.position).toBe('Senior Developer');
      expect(employee.rank).toBe('Captain');
      expect(employee.notes).toBe('Test notes');
      expect(employee.photoUrl).toBe('https://example.com/photo.jpg');
      expect(employee.isActive).toBe(true);
    });

    it('should create employee using factory method', () => {
      const employee = Employee.create(validEmployeeProps);
      
      expect(employee).toBeInstanceOf(Employee);
      expect(employee.firstName).toBe('John');
    });

    it('should set default values for optional fields', () => {
      const minimalProps: EmployeeProps = {
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '998901234567',
        department: 'HR',
        district: 'North District',
        isActive: true,
      };
      
      const employee = new Employee(minimalProps);
      
      expect(employee.middleName).toBeUndefined();
      expect(employee.additionalPhone).toBeUndefined();
      expect(employee.position).toBeUndefined();
      expect(employee.rank).toBeUndefined();
      expect(employee.notes).toBeUndefined();
      expect(employee.photoUrl).toBeUndefined();
    });

    it('should set createdAt and updatedAt dates', () => {
      const employee = new Employee(validEmployeeProps);
      
      expect(employee.createdAt).toBeInstanceOf(Date);
      expect(employee.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept valid Uzbek phone number with 998 prefix', () => {
      const props = { ...validEmployeeProps, phoneNumber: '998901234567' };
      const employee = new Employee(props);
      
      expect(employee.phoneNumber).toBe('998901234567');
    });

    it('should auto-fix 9-digit number by adding 998 prefix', () => {
      const props = { ...validEmployeeProps, phoneNumber: '901234567' };
      const employee = new Employee(props);
      
      expect(employee.phoneNumber).toBe('998901234567');
    });

    it('should clean phone number from non-numeric characters', () => {
      const props = { ...validEmployeeProps, phoneNumber: '+998 90 123-45-67' };
      const employee = new Employee(props);
      
      expect(employee.phoneNumber).toBe('998901234567');
    });

    it('should throw error for invalid phone number', () => {
      const props = { ...validEmployeeProps, phoneNumber: '123' };
      
      expect(() => new Employee(props)).toThrow('Invalid phone number format');
    });

    it('should validate additional phone number if provided', () => {
      const props = { ...validEmployeeProps, additionalPhone: '907654321' };
      const employee = new Employee(props);
      
      expect(employee.additionalPhone).toBe('998907654321');
    });

    it('should allow undefined additional phone', () => {
      const props = { ...validEmployeeProps, additionalPhone: undefined };
      const employee = new Employee(props);
      
      expect(employee.additionalPhone).toBeUndefined();
    });
  });

  describe('Full Name Generation', () => {
    it('should generate full name with middle name', () => {
      const employee = new Employee(validEmployeeProps);
      
      expect(employee.fullName).toBe('Doe John Smith');
    });

    it('should generate full name without middle name', () => {
      const props = { ...validEmployeeProps, middleName: undefined };
      const employee = new Employee(props);
      
      expect(employee.fullName).toBe('Doe John');
    });
  });

  describe('Update Methods', () => {
    let employee: Employee;

    beforeEach(() => {
      employee = new Employee(validEmployeeProps);
    });

    it('should update phone number', () => {
      employee.updatePhoneNumber('998912345678');
      
      expect(employee.phoneNumber).toBe('998912345678');
    });

    it('should update additional phone', () => {
      employee.updateAdditionalPhone('998912345678');
      expect(employee.additionalPhone).toBe('998912345678');
    });

    it('should clear additional phone', () => {
      employee.updateAdditionalPhone(undefined);
      expect(employee.additionalPhone).toBeUndefined();
    });

    it('should update department', () => {
      employee.updateDepartment('New Department');
      expect(employee.department).toBe('New Department');
    });

    it('should update district', () => {
      employee.updateDistrict('New District');
      expect(employee.district).toBe('New District');
    });

    it('should update position', () => {
      employee.updatePosition('New Position');
      expect(employee.position).toBe('New Position');
    });

    it('should update rank', () => {
      employee.updateRank('Major');
      expect(employee.rank).toBe('Major');
    });

    it('should update photo URL', () => {
      employee.updatePhoto('https://new-photo.jpg');
      expect(employee.photoUrl).toBe('https://new-photo.jpg');
    });

    it('should throw error when updating with invalid phone number', () => {
      expect(() => employee.updatePhoneNumber('invalid')).toThrow('Invalid phone number format');
    });
  });

  describe('Activation/Deactivation', () => {
    it('should activate employee', () => {
      const props = { ...validEmployeeProps, isActive: false };
      const employee = new Employee(props);
      
      expect(employee.isActive).toBe(false);
      
      employee.activate();
      expect(employee.isActive).toBe(true);
    });

    it('should deactivate employee', () => {
      const employee = new Employee(validEmployeeProps);
      
      expect(employee.isActive).toBe(true);
      
      employee.deactivate();
      expect(employee.isActive).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to plain object', () => {
      const employee = new Employee(validEmployeeProps);
      const obj = employee.toObject();
      
      expect(obj).toEqual(expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Smith',
        phoneNumber: '998901234567',
        additionalPhone: '998907654321',
        department: 'IT Department',
        district: 'Central District',
        position: 'Senior Developer',
        rank: 'Captain',
        notes: 'Test notes',
        photoUrl: 'https://example.com/photo.jpg',
        isActive: true,
      }));
      
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });

    it('should include id in object if present', () => {
      const propsWithId = { ...validEmployeeProps, id: 'emp123' };
      const employee = new Employee(propsWithId);
      const obj = employee.toObject();
      
      expect(obj.id).toBe('emp123');
    });
  });
});