import { 
  Broadcast, 
  BroadcastProps, 
  BroadcastStatus, 
  BroadcastType, 
  BroadcastPriority,
  BroadcastRecipient 
} from '../Broadcast';

describe('Broadcast Entity', () => {
  const validBroadcastProps: BroadcastProps = {
    title: 'Emergency Alert',
    message: 'This is an emergency broadcast message',
    audioFileUrl: 'https://example.com/audio.mp3',
    type: BroadcastType.VOICE,
    priority: BroadcastPriority.HIGH,
    status: BroadcastStatus.PENDING,
    recipients: [
      {
        phoneNumber: '998901234567',
        name: 'John Doe',
        status: 'pending' as const,
        attempts: 0,
      },
      {
        phoneNumber: '998907654321',
        name: 'Jane Smith',
        status: 'pending' as const,
        attempts: 0,
      }
    ],
    departmentIds: ['dept1', 'dept2'],
    districtIds: ['dist1'],
    groupIds: ['group1'],
    totalRecipients: 2,
    successCount: 0,
    failureCount: 0,
    createdBy: 'admin',
  };

  describe('Constructor and Creation', () => {
    it('should create a broadcast with valid props', () => {
      const broadcast = new Broadcast(validBroadcastProps);
      
      expect(broadcast.title).toBe('Emergency Alert');
      expect(broadcast.message).toBe('This is an emergency broadcast message');
      expect(broadcast.type).toBe(BroadcastType.VOICE);
      expect(broadcast.priority).toBe(BroadcastPriority.HIGH);
      expect(broadcast.status).toBe(BroadcastStatus.PENDING);
      expect(broadcast.recipients).toHaveLength(2);
      expect(broadcast.totalRecipients).toBe(2);
      expect(broadcast.successCount).toBe(0);
      expect(broadcast.failureCount).toBe(0);
      expect(broadcast.createdBy).toBe('admin');
    });

    it('should create broadcast using factory method', () => {
      const broadcast = Broadcast.create(validBroadcastProps);
      
      expect(broadcast).toBeInstanceOf(Broadcast);
      expect(broadcast.title).toBe('Emergency Alert');
    });

    it('should throw error if title is empty', () => {
      const props = { ...validBroadcastProps, title: '' };
      
      expect(() => new Broadcast(props)).toThrow('Broadcast title is required');
    });

    it('should throw error if message is empty', () => {
      const props = { ...validBroadcastProps, message: '' };
      
      expect(() => new Broadcast(props)).toThrow('Broadcast message is required');
    });

    it('should throw error if createdBy is missing', () => {
      const props = { ...validBroadcastProps, createdBy: '' };
      
      expect(() => new Broadcast(props)).toThrow('Broadcast creator is required');
    });

    it('should throw error if no recipients or target groups', () => {
      const props = {
        ...validBroadcastProps,
        recipients: [],
        departmentIds: undefined,
        districtIds: undefined,
        groupIds: undefined,
      };
      
      expect(() => new Broadcast(props)).toThrow('Broadcast must have at least one recipient or target group');
    });
  });

  describe('Status Management', () => {
    let broadcast: Broadcast;

    beforeEach(() => {
      broadcast = new Broadcast(validBroadcastProps);
    });

    it('should start a pending broadcast', () => {
      expect(broadcast.status).toBe(BroadcastStatus.PENDING);
      
      broadcast.start();
      
      expect(broadcast.status).toBe(BroadcastStatus.IN_PROGRESS);
      expect(broadcast.startedAt).toBeInstanceOf(Date);
    });

    it('should not start non-pending broadcast', () => {
      broadcast.start();
      
      expect(() => broadcast.start()).toThrow('Can only start pending broadcasts');
    });

    it('should complete an in-progress broadcast', () => {
      broadcast.start();
      broadcast.complete();
      
      expect(broadcast.status).toBe(BroadcastStatus.COMPLETED);
      expect(broadcast.completedAt).toBeInstanceOf(Date);
    });

    it('should not complete non-in-progress broadcast', () => {
      expect(() => broadcast.complete()).toThrow('Can only complete in-progress broadcasts');
    });

    it('should cancel a broadcast', () => {
      broadcast.cancel('admin', 'User requested cancellation');
      
      expect(broadcast.status).toBe(BroadcastStatus.CANCELLED);
      expect(broadcast.cancelledBy).toBe('admin');
      expect(broadcast.cancelReason).toBe('User requested cancellation');
      expect(broadcast.completedAt).toBeInstanceOf(Date);
    });

    it('should not cancel completed broadcast', () => {
      broadcast.start();
      broadcast.complete();
      
      expect(() => broadcast.cancel('admin')).toThrow('Cannot cancel completed or already cancelled broadcasts');
    });

    it('should fail a broadcast', () => {
      broadcast.fail('Network error');
      
      expect(broadcast.status).toBe(BroadcastStatus.FAILED);
      expect(broadcast.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('Recipient Management', () => {
    let broadcast: Broadcast;

    beforeEach(() => {
      broadcast = new Broadcast(validBroadcastProps);
    });

    it('should add a new recipient', () => {
      const newRecipient: BroadcastRecipient = {
        phoneNumber: '998912345678',
        name: 'New Person',
        status: 'pending' as const,
        attempts: 0,
      };
      
      broadcast.addRecipient(newRecipient);
      
      expect(broadcast.recipients).toHaveLength(3);
      expect(broadcast.totalRecipients).toBe(3);
    });

    it('should update recipient status to success', () => {
      broadcast.updateRecipientStatus('998901234567', 'success', 45);
      
      const recipient = broadcast.recipients.find(r => r.phoneNumber === '998901234567');
      
      expect(recipient?.status).toBe('success');
      expect(recipient?.duration).toBe(45);
      expect(recipient?.attempts).toBe(1);
      expect(broadcast.successCount).toBe(1);
    });

    it('should update recipient status to failed', () => {
      broadcast.updateRecipientStatus('998901234567', 'failed', undefined, 'No answer');
      
      const recipient = broadcast.recipients.find(r => r.phoneNumber === '998901234567');
      
      expect(recipient?.status).toBe('failed');
      expect(recipient?.errorMessage).toBe('No answer');
      expect(broadcast.failureCount).toBe(1);
    });

    it('should throw error for non-existent recipient', () => {
      expect(() => 
        broadcast.updateRecipientStatus('998999999999', 'success')
      ).toThrow('Recipient with phone 998999999999 not found');
    });

    it('should not double-count success', () => {
      broadcast.updateRecipientStatus('998901234567', 'success');
      expect(broadcast.successCount).toBe(1);
      
      broadcast.updateRecipientStatus('998901234567', 'success');
      expect(broadcast.successCount).toBe(1); // Should still be 1
    });
  });

  describe('Progress Calculation', () => {
    const createFreshBroadcast = () => {
      const props = {
        ...validBroadcastProps,
        recipients: [
          {
            phoneNumber: '998901234567',
            name: 'John Doe',
            status: 'pending' as const,
            attempts: 0,
          },
          {
            phoneNumber: '998907654321',
            name: 'Jane Smith',
            status: 'pending' as const,
            attempts: 0,
          }
        ],
        totalRecipients: 10,
        successCount: 0,
        failureCount: 0,
      };
      return new Broadcast(props);
    };

    it('should calculate progress percentage', () => {
      const broadcast = createFreshBroadcast();
      expect(broadcast.progressPercentage).toBe(0);
      
      // Update recipients to simulate progress
      broadcast.updateRecipientStatus('998901234567', 'success');
      expect(broadcast.successCount).toBe(1);
      expect(broadcast.failureCount).toBe(0);
      
      broadcast.updateRecipientStatus('998907654321', 'failed');
      expect(broadcast.successCount).toBe(1);
      expect(broadcast.failureCount).toBe(1);
      
      // With totalRecipients: 10, successCount: 1, failureCount: 1
      // progressPercentage = (1+1)/10 * 100 = 20%
      expect(broadcast.progressPercentage).toBe(20);
    });

    it('should calculate success rate', () => {
      const broadcast = createFreshBroadcast();
      expect(broadcast.successRate).toBe(0);
      
      // Update recipients to simulate success/failure
      broadcast.updateRecipientStatus('998901234567', 'success');
      broadcast.updateRecipientStatus('998907654321', 'failed');
      
      // successRate = successCount / (successCount + failureCount) * 100
      // = 1 / (1 + 1) * 100 = 50%
      expect(broadcast.successRate).toBe(50);
    });

    it('should handle zero total recipients', () => {
      const props = {
        ...validBroadcastProps,
        totalRecipients: 0,
        recipients: [],
        departmentIds: ['dept1'],
      };
      const emptyBroadcast = new Broadcast(props);
      
      expect(emptyBroadcast.progressPercentage).toBe(0);
      expect(emptyBroadcast.successRate).toBe(0);
    });
  });

  describe('Business Rules', () => {
    let broadcast: Broadcast;

    beforeEach(() => {
      broadcast = new Broadcast(validBroadcastProps);
    });

    it('should check if broadcast can be started', () => {
      expect(broadcast.canBeStarted()).toBe(true);
      
      broadcast.start();
      expect(broadcast.canBeStarted()).toBe(false);
    });

    it('should check if broadcast can be cancelled', () => {
      expect(broadcast.canBeCancelled()).toBe(true);
      
      broadcast.start();
      expect(broadcast.canBeCancelled()).toBe(true);
      
      broadcast.complete();
      expect(broadcast.canBeCancelled()).toBe(false);
    });

    it('should check if broadcast is scheduled', () => {
      expect(broadcast.isScheduled()).toBe(false);
      
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const scheduledProps = {
        ...validBroadcastProps,
        scheduledAt: futureDate,
      };
      const scheduledBroadcast = new Broadcast(scheduledProps);
      
      expect(scheduledBroadcast.isScheduled()).toBe(true);
    });

    it('should check if broadcast is active', () => {
      expect(broadcast.isActive()).toBe(false);
      
      broadcast.start();
      expect(broadcast.isActive()).toBe(true);
      
      broadcast.complete();
      expect(broadcast.isActive()).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to plain object', () => {
      // Create fresh broadcast for this test to avoid pollution
      const freshProps = {
        ...validBroadcastProps,
        recipients: [
          {
            phoneNumber: '998901234567',
            name: 'John Doe',
            status: 'pending' as const,
            attempts: 0,
          },
          {
            phoneNumber: '998907654321',
            name: 'Jane Smith',
            status: 'pending' as const,
            attempts: 0,
          }
        ]
      };
      const broadcast = new Broadcast(freshProps);
      const obj = broadcast.toObject();
      
      expect(obj).toEqual(expect.objectContaining({
        title: 'Emergency Alert',
        message: 'This is an emergency broadcast message',
        type: BroadcastType.VOICE,
        priority: BroadcastPriority.HIGH,
        status: BroadcastStatus.PENDING,
        totalRecipients: 2,
        successCount: 0,
        failureCount: 0,
        createdBy: 'admin',
      }));
      
      expect(obj.recipients).toHaveLength(2);
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);
    });
  });
});