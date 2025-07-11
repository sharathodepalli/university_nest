import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    DEV: true,
    PROD: false,
  },
  writable: true,
})

// Mock Supabase client for testing
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
  isSupabaseConfigured: vi.fn(() => true),
}))

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL for image upload tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock canvas for image processing tests
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
  drawImage: vi.fn(),
  toBlob: vi.fn((callback) => callback(new Blob(['test'], { type: 'image/jpeg' }))),
}))

// Mock FileReader for image tests
class MockFileReader {
  readAsDataURL = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  static readonly EMPTY = 0
  static readonly LOADING = 1
  static readonly DONE = 2
}
global.FileReader = MockFileReader as unknown as typeof FileReader

// Extend window with custom properties if needed
declare global {
  interface Window {
    // Add any global properties needed for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}
