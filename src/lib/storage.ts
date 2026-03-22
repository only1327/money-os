export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface AppSettings {
  pinHash: string | null;
  currency: string;
  autoLockSeconds: number;
}

const TRANSACTIONS_KEY = 'moneyos_transactions';
const SETTINGS_KEY = 'moneyos_settings';

const defaultSettings: AppSettings = {
  pinHash: null,
  currency: 'USD',
  autoLockSeconds: 60,
};

export function getTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(txs: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const txs = getTransactions();
  txs.unshift(newTx);
  saveTransactions(txs);
  return newTx;
}

export function deleteTransaction(id: string) {
  const txs = getTransactions().filter(t => t.id !== id);
  saveTransactions(txs);
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// Simple hash for PIN (not cryptographically strong, but fine for local lock)
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'moneyos_salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Housing', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Education', 'Other'],
} as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Salary: '💰', Freelance: '💻', Investment: '📈', Gift: '🎁',
  Food: '🍔', Transport: '🚗', Housing: '🏠', Shopping: '🛍️',
  Health: '❤️', Entertainment: '🎮', Bills: '📄', Education: '📚', Other: '📌',
};
