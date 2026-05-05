import { useEffect, useState } from "react";
import "./schematic-copy-success-indicator.scss";

type SchematicCopySuccessIndicatorProps = {
  visible: boolean;
};

const EXIT_ANIMATION_MS = 220;

export default function SchematicCopySuccessIndicator({
  visible,
}: SchematicCopySuccessIndicatorProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      setIsExiting(false);
      return;
    }

    if (!isMounted) {
      return;
    }

    setIsExiting(true);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
      setIsExiting(false);
    }, EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`schematic-copy-success${isExiting ? " schematic-copy-success--exit" : ""}`}
      aria-hidden="true"
    >
      <div className="schematic-copy-success__backdrop" />
      <div className="schematic-copy-success__badge">
        <svg
          className="schematic-copy-success__check"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 12.5L10 17.5L19 7.5" />
        </svg>
      </div>
    </div>
  );
}
