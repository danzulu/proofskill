import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProcessingOverlayProps = {
  title: string;
  description: string;
};

export function ProcessingOverlay({ title, description }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md border-primary/30 shadow-2xl">
        <CardContent
          aria-atomic="true"
          aria-live="polite"
          className="p-8 text-center"
          role="status"
        >
          <Loader2 className="mx-auto size-9 animate-spin text-primary motion-reduce:animate-none" />
          <h2 className="mt-5 text-2xl tracking-tight">{title}</h2>
          <p className="mt-3 leading-6 text-muted-foreground">{description}</p>
          <p className="mt-5 text-xs text-muted-foreground">Keep this page open. Your selections are safe.</p>
        </CardContent>
      </Card>
    </div>
  );
}
