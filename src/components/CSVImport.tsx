import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, AlertTriangle } from 'lucide-react';
import { addTransaction, type Transaction } from '@/lib/storage';

interface CSVImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (txs: Transaction[]) => void;
}

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/uber|lyft|gas|parking|transit|metro/.test(d)) return 'Transport';
  if (/restaurant|food|pizza|coffee|starbucks|mcdonald|doordash|grubhub/.test(d)) return 'Food';
  if (/rent|mortgage|electric|water|internet/.test(d)) return 'Housing';
  if (/amazon|walmart|target|shop|store|mall/.test(d)) return 'Shopping';
  if (/doctor|pharmacy|hospital|health|gym/.test(d)) return 'Health';
  if (/netflix|spotify|movie|game|hulu|disney/.test(d)) return 'Entertainment';
  if (/electric|phone|insurance|bill/.test(d)) return 'Bills';
  if (/school|course|book|tuition/.test(d)) return 'Education';
  if (/salary|payroll|deposit|transfer in/.test(d)) return 'Salary';
  return 'Other';
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    // Try to detect date, amount, description
    let date = '', amount = 0, description = '';
    
    for (const col of cols) {
      if (!date && /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(col)) {
        const parsed = new Date(col);
        if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
      } else if (!amount && /^-?\$?[\d,]+\.?\d*$/.test(col.replace(/[$,]/g, ''))) {
        amount = parseFloat(col.replace(/[$,]/g, ''));
      } else if (col.length > 2 && !description) {
        description = col;
      }
    }

    if (date && amount !== 0) {
      rows.push({
        date,
        description: description || 'Imported',
        amount: Math.abs(amount),
        type: amount >= 0 ? 'income' : 'expense',
        category: guessCategory(description),
      });
    }
  }

  return rows;
}

export default function CSVImport({ open, onClose, onImport }: CSVImportProps) {
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError('Could not parse any transactions. Make sure CSV has date & amount columns.');
          return;
        }
        setParsed(rows);
      } catch {
        setError('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setImporting(true);
    const imported: Transaction[] = [];
    parsed.forEach(row => {
      const tx = addTransaction({
        type: row.type,
        amount: row.amount,
        category: row.category,
        description: row.description,
        date: row.date,
      });
      imported.push(tx);
    });
    onImport(imported);
    setParsed([]);
    setImporting(false);
    onClose();
  };

  const handleClose = () => {
    setParsed([]);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-background/80" onClick={handleClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative w-full max-w-lg bg-card border-t-3 border-x-3 border-accent shadow-[0_-6px_0px_hsl(40,95%,55%)] p-5 safe-bottom max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" strokeWidth={3} /> Import CSV
              </h2>
              <button onClick={handleClose} className="p-2 border-2 border-muted-foreground/20 hover:border-primary">
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>

            {parsed.length === 0 ? (
              <div>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-12 border-3 border-dashed border-accent/50 hover:border-accent flex flex-col items-center gap-3 transition-colors"
                >
                  <Upload className="w-10 h-10 text-accent" strokeWidth={2} />
                  <p className="text-sm font-bold">DROP CSV OR TAP TO UPLOAD</p>
                  <p className="text-[10px] text-muted-foreground">Bank statements, credit card exports</p>
                </button>
                {error && (
                  <div className="mt-3 p-3 border-2 border-destructive bg-destructive/10 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Found <span className="font-bold text-primary">{parsed.length}</span> transactions. AI auto-categorized them.
                </p>
                <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
                  {parsed.slice(0, 20).map((row, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border-2 border-muted-foreground/10 text-xs">
                      <span className="text-mono text-muted-foreground w-16 shrink-0">{row.date.slice(5)}</span>
                      <span className="flex-1 truncate">{row.description}</span>
                      <span className={`font-bold text-mono ${row.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {row.type === 'income' ? '+' : '-'}{getCurrencySymbol()}{row.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {parsed.length > 20 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">+{parsed.length - 20} more</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleImport} disabled={importing} className="flex-1 py-3 brutal-btn-primary text-sm flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" strokeWidth={3} />
                    IMPORT {parsed.length} TRANSACTIONS
                  </button>
                  <button onClick={() => setParsed([])} className="px-4 py-3 bg-secondary border-2 border-muted-foreground/20 text-sm font-bold">
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
