import { Toaster } from "@/components/ui/sonner";

const Layout = ({ children }) => {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div>{children}</div>
      <Toaster />
    </div>
  );
};

export default Layout;
