import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

const Layout = ({ children }) => {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div>{children}</div>
      <Toaster />
    </div>
  );
};

export default Layout;
