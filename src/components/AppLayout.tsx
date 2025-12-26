import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ConnectionIndicator } from '@/components/ConnectionIndicator';
import { useAuth } from '@/hooks/useAuth';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  backButton?: ReactNode;
}

export function AppLayout({ children, title, backButton }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center justify-between border-b bg-card px-3 sm:px-4 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger className="lg:hidden flex-shrink-0">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              {backButton}
              {title && (
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
                  {title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <ConnectionIndicator />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
