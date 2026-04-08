import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useRefreshOnFocus(onRefresh) {
  const router = useRouter();

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      onRefresh?.();
    }
  }, [onRefresh]);

  const handlePageShow = useCallback(
    (e) => {
      // e.persisted = true means page was restored from bfcache (back/forward)
      if (e.persisted) {
        onRefresh?.();
        router.refresh();
      }
    },
    [onRefresh, router]
  );

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [handleVisibilityChange, handlePageShow]);
}