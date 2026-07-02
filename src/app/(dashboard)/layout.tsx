import { AppLayout } from "@/components/layout/app-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RealtimeListener } from "@/components/realtime-listener";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <RealtimeListener />
      <AppLayout>
        {children}
      </AppLayout>
    </TooltipProvider>
  );
}
