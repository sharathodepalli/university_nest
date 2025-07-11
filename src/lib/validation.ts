import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  university: z.string().min(2, 'University name required'),
  year: z.enum(['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD']),
  bio: z.string().max(500, 'Bio too long').optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional()
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required')
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Listing validation schemas
export const listingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description too long'),
  price: z.number().min(100, 'Price must be at least $100').max(10000, 'Price too high'),
  address: z.string().min(10, 'Address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  roomType: z.enum(['single', 'shared', 'studio', 'apartment']),
  maxOccupants: z.number().min(1).max(10),
  availableFrom: z.date(),
  availableTo: z.date().optional(),
  deposit: z.number().min(0).optional(),
  amenities: z.array(z.string()).max(20, 'Too many amenities'),
  rules: z.array(z.string()).max(10, 'Too many rules'),
  preferences: z.object({
    gender: z.enum(['male', 'female', 'any']).optional(),
    smokingAllowed: z.boolean(),
    petsAllowed: z.boolean(),
    studyFriendly: z.boolean()
  })
});

// Message validation
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  type: z.enum(['text', 'image', 'system']).default('text')
});

// Search filters validation
export const searchFiltersSchema = z.object({
  location: z.string().optional(),
  university: z.string().optional(),
  maxDistance: z.number().min(1).max(100).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).optional(),
  roomType: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  availableFrom: z.date().optional()
});

// Utility functions for validation
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
};