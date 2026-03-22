import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Search, Filter } from 'lucide-react';
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
    <div className="space-y-4 pb-24">
      {/* Search */}
      <div className="glass-panel rounded-xl p-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f ? 'bg-primary text-primary-foreground neo-brutal-sm' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No transactions found</div>
      ) : (
        grouped.map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{date}</p>
            <div className="space-y-1">
              <AnimatePresence>
                {txs.map(tx => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="glass-panel rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0">
                      {CATEGORY_ICONS[tx.category] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
                      <p className="text-xs text-muted-foreground">{tx.category}</p>
                    </div>
                    <span className={`text-sm font-semibold font-mono shrink-0 ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
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
