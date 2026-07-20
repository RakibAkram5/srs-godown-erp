import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10"
      >
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </motion.div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
