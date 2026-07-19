import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border shadow-soft-lg text-sm',
        },
      }}
      {...props}
    />
  );
}
