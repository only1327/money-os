import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Search } from 'lucide-react';
import { Transaction, CATEGORY_ICONS, deleteTransaction } from '@/lib/storage';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || t.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      const key = format(new Date(t.date), 'MMM d, yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups);
  }, [filtered]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    onDelete(id);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Search */}
      <div className="brutal-input p-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" strokeWidth={3} />
        <input
          type="text"
          placeholder="SEARCH..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/40 uppercase tracking-wider"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-2 ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary-foreground shadow-[3px_3px_0px] shadow-primary-foreground'
                : 'bg-secondary text-secondary-foreground border-muted-foreground/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm font-bold uppercase">No transactions found</div>
      ) : (
        grouped.map(([date, txs]) => (
          <div key={date}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">{date}</p>
            <div className="space-y-1">
              <AnimatePresence>
                {txs.map(tx => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ duration: 0.12 }}
                    className="brutal-card-muted p-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-secondary border-2 border-muted-foreground/20 flex items-center justify-center text-base shrink-0">
                      {CATEGORY_ICONS[tx.category] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{tx.description || tx.category}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{tx.category}</p>
                    </div>
                    <span className={`text-sm font-bold text-mono shrink-0 ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 hover:bg-destructive/20 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
