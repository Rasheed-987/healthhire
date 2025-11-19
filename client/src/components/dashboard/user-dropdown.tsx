import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubscription } from "@/hooks/useSubscription";
import { Crown, CreditCard, LogOut, Settings, Shield } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { AdminSettingsDialog } from "@/components/admin/admin-settings-dialog";
import { UserSettingsDialog } from "@/components/user/user-settings-dialog";

interface User {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  email?: string;
  isAdmin?: boolean;
  adminRole?: string;
}

interface UserDropdownProps {
  user?: User;
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const { isPaid } = useSubscription();
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    window.location.href = "/login";
  };
 

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="w-10 h-10 rounded-full border-2 border-border overflow-hidden bg-muted cursor-pointer">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="User profile photo"
                className="w-full h-full object-cover"
                data-testid="img-avatar"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-primary font-medium">
                  {user?.firstName?.[0] || user?.lastName?.[0] || "U"}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium text-foreground">
              {user?.firstName || user?.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "User"}
            </p>
            {isPaid && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Crown className="h-3 w-3 text-primary" />
                <span>Premium Member</span>
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/pricing" className={"flex items-center gap-2"}>
              <CreditCard className="h-3 w-3" />
              Manage Subscription
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user?.isAdmin && (
            <>
              <DropdownMenuItem 
                onClick={() => setAdminSettingsOpen(true)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Admin Settings
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {!user?.isAdmin && (
            <>
              <DropdownMenuItem 
                onClick={() => setUserSettingsOpen(true)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  User Settings
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild className="cursor-pointer">
              <Link
              href="/privacy"
              className="flex items-center gap-2"
              data-testid="privacy-settings-link"
            >
              <Settings className="h-3 w-3" />
              Privacy settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <LogOut className="h-3 w-3" />
              Sign out
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {user?.isAdmin && user?.email && (
        <AdminSettingsDialog
          open={adminSettingsOpen}
          onOpenChange={setAdminSettingsOpen}
          currentUser={{
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }}
        />
      )}
      
      {user && !user.isAdmin && user.email && (
        <UserSettingsDialog
          open={userSettingsOpen}
          onOpenChange={setUserSettingsOpen}
          currentUser={{
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }}
        />
      )}
    </>
  );
}
