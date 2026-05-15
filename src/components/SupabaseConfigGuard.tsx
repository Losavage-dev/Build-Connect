import { ReactNode } from "react";
import { supabaseConfigError } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function SupabaseConfigGuard({ children }: { children: ReactNode }) {
  if (!supabaseConfigError) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">Нет подключения к базе данных</h1>
        <p className="text-sm text-muted-foreground">{supabaseConfigError}</p>
        <p className="text-xs text-muted-foreground">
          Скопируйте <code className="bg-muted px-1 rounded">.env.example</code> в{" "}
          <code className="bg-muted px-1 rounded">.env</code> и укажите URL и ключ из панели Supabase
          (Settings → API). После изменения перезапустите <code className="bg-muted px-1 rounded">npm run dev</code>.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    </div>
  );
}
