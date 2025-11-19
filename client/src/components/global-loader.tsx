import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { FullscreenLoader } from "@/components/fullscreen-loader";

export function GlobalLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const active = isFetching + isMutating > 0;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    if (active) {
      // small delay to avoid flicker on very fast requests
      t = window.setTimeout(() => setShow(true), 120);
    } else {
      // quick fade-out
      setShow(false);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [active]);

  return <FullscreenLoader show={show} message="Please wait..." />;
}
