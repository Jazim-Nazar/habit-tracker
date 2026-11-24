import { LifeOSDatabase } from './db.types';
import { LocalLifeOSDatabase } from './local.client';
import { SupabaseLifeOSDatabase, isSupabaseConfigured } from './supabase.client';

let dbInstance: LifeOSDatabase | null = null;

export const getDatabase = (): LifeOSDatabase => {
  if (dbInstance) return dbInstance;

  if (isSupabaseConfigured()) {
    try {
      console.log('LifeOS: Connecting to Supabase database...');
      dbInstance = new SupabaseLifeOSDatabase();
    } catch (e) {
      console.error('LifeOS: Failed to initialize Supabase. Falling back to local storage.', e);
      dbInstance = new LocalLifeOSDatabase();
    }
  } else {
    console.log('LifeOS: Supabase variables not set. Using local database (LocalStorage/IndexedDB)...');
    dbInstance = new LocalLifeOSDatabase();
  }

  return dbInstance;
};

export type {
  LifeOSDatabase, Category, Subject, Module, Lecture,
  TimetableTemplate, TimetableBlock, WeeklyGoals, MockTest, UserSettings,
  FullTimetableBlock
} from './db.types';
export { isSupabaseConfigured } from './supabase.client';
export { generateId } from './local.client';
export const db = getDatabase();
