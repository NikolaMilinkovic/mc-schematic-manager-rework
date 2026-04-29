import { useCallback, useEffect, useRef, useState } from "react";
import customFetch from "../../lib/custom_fetch";

type ImageUrlResponse = {
  url?: string;
  expires_in?: number;
};

type SchematicImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  schematicId: string;
  imageUrl: string;
  refreshIntervalMs?: number;
};

const DEFAULT_REFRESH_INTERVAL_MS = 55 * 60 * 1000;

function SchematicImage({
  schematicId,
  imageUrl,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
  onError,
  ...imgProps
}: SchematicImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState(imageUrl);
  const isRefreshingRef = useRef(false);
  const didErrorRefreshRef = useRef(false);

  const refreshUrl = useCallback(async () => {
    if (!schematicId || isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;
    try {
      const response = await customFetch<ImageUrlResponse>(
        `/schematics/${schematicId}/image-url`,
        "GET",
      );

      if (response.status >= 400 || !response.data?.url) {
        return false;
      }

      setResolvedUrl(response.data.url);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [schematicId]);

  useEffect(() => {
    setResolvedUrl(imageUrl);
    didErrorRefreshRef.current = false;
  }, [imageUrl]);

  useEffect(() => {
    if (!schematicId || !resolvedUrl) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshUrl();
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshIntervalMs, refreshUrl, resolvedUrl, schematicId]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (!didErrorRefreshRef.current) {
      didErrorRefreshRef.current = true;
      void refreshUrl();
    }

    onError?.(event);
  };

  return <img {...imgProps} src={resolvedUrl} onError={handleError} />;
}

export default SchematicImage;
