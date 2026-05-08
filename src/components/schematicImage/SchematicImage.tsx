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
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);
  const didErrorRefreshRef = useRef(false);
  const preloadAttemptRef = useRef(0);

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
    setRenderedUrl(null);
    didErrorRefreshRef.current = false;
  }, [imageUrl]);

  useEffect(() => {
    if (!resolvedUrl) {
      setRenderedUrl(null);
      return;
    }

    let isCancelled = false;
    const preloadAttempt = ++preloadAttemptRef.current;
    const preloadedImage = new Image();

    const finish = () => {
      if (isCancelled || preloadAttempt !== preloadAttemptRef.current) {
        return;
      }

      setRenderedUrl(resolvedUrl);
    };

    preloadedImage.src = resolvedUrl;

    if (typeof preloadedImage.decode === "function") {
      void preloadedImage
        .decode()
        .then(finish)
        .catch(() => {
          if (preloadedImage.complete) {
            finish();
            return;
          }

          preloadedImage.addEventListener("load", finish, { once: true });
          preloadedImage.addEventListener("error", finish, { once: true });
        });
    } else {
      preloadedImage.addEventListener("load", finish, { once: true });
      preloadedImage.addEventListener("error", finish, { once: true });
    }

    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl]);

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

  return (
    <img {...imgProps} src={renderedUrl ?? undefined} onError={handleError} />
  );
}

export default SchematicImage;
