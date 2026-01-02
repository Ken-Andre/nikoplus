import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("SW Registered:", swUrl);
      // Check for updates every 30 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold">Mise à jour disponible</h4>
          <p className="text-sm opacity-90 mt-1">
            Une nouvelle version de NICKOPLUS PRO est disponible.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              className="flex-1"
            >
              Mettre à jour
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
