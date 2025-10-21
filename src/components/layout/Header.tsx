import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-bold text-primary">Pyramids Factory</h1>
        <p className="text-xs text-muted-foreground">Manufacturing Dashboard</p>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
    </header>
  );
};
