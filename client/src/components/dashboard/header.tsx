import logoHealthhire from "@assets/Portal_1756483081930.png";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import UserDropdown from "./user-dropdown";

interface User {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface HeaderProps {
  user?: User;
  profileCompletion: number;
}

export default function Header({ user, profileCompletion }: HeaderProps) {
  return (
    <header
      className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={logoHealthhire}
                alt="HealthHire Portal"
                className="w-10 h-10 object-contain"
                data-testid="img-logo"
              />
            </div>
            <div>
              <h1
                className="text-xl font-semibold text-foreground"
                data-testid="text-logo"
              >
                HealthHire Portal
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
              Your career toolkit for healthcare success              </p>
            </div>
          </div>

          {/* Theme Toggle, Progress Ring & User Avatar */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar Dropdown */}
            <UserDropdown user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
