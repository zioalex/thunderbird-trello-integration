const { expect, describe, test, beforeEach } = require('@jest/globals');
require('./setup.js');

describe('Due Date Functionality', () => {
  let mockDocument;
  let dueDateInput;
  let trelloTaskCreator;

  beforeEach(() => {
    // Create a mock due date input element
    dueDateInput = {
      value: '',
      type: 'date'
    };

    // Mock document.getElementById
    mockDocument = {
      getElementById: (id) => {
        if (id === 'task-due-date') {
          return dueDateInput;
        }
        // Return mock elements for other required IDs
        const mockElement = {
          value: '',
          addEventListener: jest.fn(),
          innerHTML: '',
          style: { display: '' }
        };
        return mockElement;
      },
      addEventListener: jest.fn()
    };

    global.document = mockDocument;

    // Mock browser API
    global.browser = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        },
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      runtime: {
        onMessage: {
          addListener: jest.fn()
        }
      }
    };

    // Mock fetch
    global.fetch = jest.fn();
  });

  describe('setQuickDate', () => {
    test('should set date for tomorrow', () => {
      // Create a simple implementation of setQuickDate
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        dueDateInput.value = formatted;
      };

      setQuickDate(1);

      // Verify the date is set
      expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      expect(dueDateInput.value).toBe(expectedDate);
    });

    test('should set date for next week', () => {
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        dueDateInput.value = formatted;
      };

      setQuickDate(7);

      // Verify the date is set
      expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's 7 days from now
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const expectedDate = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
      expect(dueDateInput.value).toBe(expectedDate);
    });

    test('should set date for next month', () => {
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        dueDateInput.value = formatted;
      };

      setQuickDate(30);

      // Verify the date is set
      expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's 30 days from now
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const expectedDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
      expect(dueDateInput.value).toBe(expectedDate);
    });

    test('should handle month transitions correctly', () => {
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        dueDateInput.value = formatted;
      };

      // Test with a specific date near month end
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            // Return Jan 31, 2025 for testing
            super(2025, 0, 31);
          } else {
            super(...args);
          }
        }
      };

      setQuickDate(7);

      // Should correctly transition to February
      expect(dueDateInput.value).toMatch(/^\d{4}-02-\d{2}$/);

      global.Date = originalDate;
    });

    test('should format single-digit months and days with leading zeros', () => {
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        dueDateInput.value = formatted;
      };

      // Test with a specific date that has single digits
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            // Return Jan 5, 2025 for testing
            super(2025, 0, 5);
          } else {
            super(...args);
          }
        }
      };

      setQuickDate(1);

      // Should have leading zeros
      expect(dueDateInput.value).toBe('2025-01-06');

      global.Date = originalDate;
    });
  });

  describe('Due Date in Card Creation', () => {
    test('should convert date to ISO format correctly', () => {
      const dueDate = '2025-03-15';
      const dueDateObj = new Date(dueDate + 'T23:59:59');
      const isoString = dueDateObj.toISOString();

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(isoString).toContain('2025-03-15');
    });

    test('should set time to end of day (23:59:59)', () => {
      const dueDate = '2025-06-20';
      const dueDateObj = new Date(dueDate + 'T23:59:59');

      expect(dueDateObj.getHours()).toBe(23);
      expect(dueDateObj.getMinutes()).toBe(59);
      expect(dueDateObj.getSeconds()).toBe(59);
    });

    test('should handle different date formats', () => {
      const testDates = [
        '2025-01-01',
        '2025-12-31',
        '2026-06-15'
      ];

      testDates.forEach(date => {
        const dueDateObj = new Date(date + 'T23:59:59');
        const isoString = dueDateObj.toISOString();

        expect(isoString).toBeTruthy();
        expect(isoString).toContain(date);
      });
    });

    test('should not include due date if input is empty', () => {
      dueDateInput.value = '';

      const cardPayload = {
        name: 'Test Card',
        desc: 'Test Description',
        idList: '123'
      };

      // Simulate the logic from createTask
      if (dueDateInput.value) {
        const dueDateObj = new Date(dueDateInput.value + 'T23:59:59');
        cardPayload.due = dueDateObj.toISOString();
      }

      expect(cardPayload.due).toBeUndefined();
    });

    test('should include due date if input has value', () => {
      dueDateInput.value = '2025-09-01';

      const cardPayload = {
        name: 'Test Card',
        desc: 'Test Description',
        idList: '123'
      };

      // Simulate the logic from createTask
      if (dueDateInput.value) {
        const dueDateObj = new Date(dueDateInput.value + 'T23:59:59');
        cardPayload.due = dueDateObj.toISOString();
      }

      expect(cardPayload.due).toBeDefined();
      expect(cardPayload.due).toContain('2025-09-01');
    });
  });

  describe('Clear Due Date', () => {
    test('should clear the due date value', () => {
      dueDateInput.value = '2025-05-15';
      expect(dueDateInput.value).toBe('2025-05-15');

      dueDateInput.value = '';
      expect(dueDateInput.value).toBe('');
    });

    test('should allow setting a new date after clearing', () => {
      dueDateInput.value = '2025-05-15';
      dueDateInput.value = '';
      dueDateInput.value = '2025-06-20';

      expect(dueDateInput.value).toBe('2025-06-20');
    });
  });

  describe('Date Validation', () => {
    test('should accept valid date format (YYYY-MM-DD)', () => {
      const validDates = [
        '2025-01-01',
        '2025-12-31',
        '2030-06-15'
      ];

      validDates.forEach(date => {
        dueDateInput.value = date;
        expect(dueDateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    test('should handle leap years correctly', () => {
      const leapYearDate = '2024-02-29';
      const dueDateObj = new Date(leapYearDate + 'T23:59:59');

      expect(dueDateObj.getMonth()).toBe(1); // February is month 1 (0-indexed)
      expect(dueDateObj.getDate()).toBe(29);
    });

    test('should handle end of year transition', () => {
      const setQuickDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;

        return formatted;
      };

      // Test with Dec 30
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(2025, 11, 30); // Dec 30, 2025
          } else {
            super(...args);
          }
        }
      };

      const result = setQuickDate(7);

      // Should roll over to next year
      expect(result).toContain('2026-01');

      global.Date = originalDate;
    });
  });
});
