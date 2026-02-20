import {
  AuthLoginSchema,
  AuthRegisterSchema,
  TransactionCreateSchema,
  TransactionUpdateSchema,
  RuleCreateSchema,
} from './validation'

describe('AuthLoginSchema', () => {
  it('should validate correct login data', () => {
    const data = {
      action: 'login' as const,
      name: 'TestUser',
      pin: '1234',
    }
    const result = AuthLoginSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const data = {
      action: 'login' as const,
      name: '',
      pin: '1234',
    }
    const result = AuthLoginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject short PIN', () => {
    const data = {
      action: 'login' as const,
      name: 'TestUser',
      pin: '123',
    }
    const result = AuthLoginSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('AuthRegisterSchema', () => {
  it('should validate correct register data', () => {
    const data = {
      action: 'register' as const,
      name: 'NewUser',
      pin: '1234',
    }
    const result = AuthRegisterSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('TransactionCreateSchema', () => {
  it('should validate correct transaction data', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: 'Test transaction',
      amount: -50.0,
      origin: 'Personal',
      bank: 'Main Bank',
      tags: ['groceries'],
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept any non-empty origin string', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: 'Test',
      amount: -50.0,
      origin: 'Joint',
      bank: 'Test Bank',
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept Couple as origin', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: 'Test',
      amount: -50.0,
      origin: 'Couple',
      bank: 'Test Bank',
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty origin', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: 'Test',
      amount: -50.0,
      origin: '',
      bank: 'Test Bank',
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject empty description', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: '',
      amount: -50.0,
      origin: 'Personal',
      bank: 'Test Bank',
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject invalid date format', () => {
    const data = {
      date: '23/12/2025',
      description: 'Test',
      amount: -50.0,
      origin: 'Personal',
      bank: 'Test Bank',
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should accept optional tags array', () => {
    const data = {
      date: '2025-12-23T10:30:00Z',
      description: 'Test',
      amount: -50.0,
      origin: 'Personal',
      bank: 'Test Bank',
      tags: ['tag1', 'tag2', 'tag3'],
    }
    const result = TransactionCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3'])
    }
  })
})

describe('TransactionUpdateSchema', () => {
  it('should validate correct update data', () => {
    const data = {
      id: 'clxabcd1234567890',
      majorCategoryId: 'mc_income',
      categoryId: 'cat_salary',
      tags: ['work'],
      notes: 'Updated note',
    }
    const result = TransactionUpdateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept partial updates', () => {
    const data = {
      id: 'clxabcd1234567890',
      notes: 'Just updating notes',
    }
    const result = TransactionUpdateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject invalid CUID format', () => {
    const data = {
      id: 'invalid-id',
      notes: 'Test',
    }
    const result = TransactionUpdateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('RuleCreateSchema', () => {
  it('should validate correct rule data', () => {
    const data = {
      keyword: 'continente',
      majorCategory: 'Variable Costs',
      category: 'Groceries',
      tags: ['groceries'],
      isDefault: false,
    }
    const result = RuleCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept empty tags array', () => {
    const data = {
      keyword: 'uber',
      majorCategory: 'Variable Costs',
      category: 'Transport',
      tags: [],
    }
    const result = RuleCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty keyword', () => {
    const data = {
      keyword: '',
      majorCategory: 'Test',
      category: 'Test',
      tags: [],
    }
    const result = RuleCreateSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
