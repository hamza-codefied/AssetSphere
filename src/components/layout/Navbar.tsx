import { useState, useEffect } from 'react';
import { Search, Bell, Menu, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <nav className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-accent rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets, tools, employees..."
            className="w-full bg-accent/50 border-transparent focus:bg-accent focus:ring-1 focus:ring-primary h-10 pl-10 pr-4 rounded-xl text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-accent rounded-xl text-muted-foreground transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 hover:bg-accent rounded-xl relative text-muted-foreground transition-colors">
          <Bell className="w-5 h-5" />

          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-border mx-2"></div>
        
        <button className="flex items-center gap-3 p-1.5 hover:bg-accent rounded-xl transition-colors">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
            JD
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold leading-none">John Doe</p>
            <p className="text-xs text-muted-foreground leading-none mt-1">IT Admin</p>
          </div>
        </button>
      </div>
    </nav>
  );
};
