import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./schematic-renderer-demo-modal.scss";

type SchematicRendererDemoModalProps = {
  opened: boolean;
  onClose: () => void;
  schematicName: string;
  loadSchematicArrayBuffer: () => Promise<ArrayBuffer>;
};

type UmdConstructor = new (
  canvas: HTMLCanvasElement,
  schematicData?: Record<string, () => Promise<ArrayBuffer>>,
  defaultResourcePacks?: Record<string, () => Promise<Blob>>,
  options?: Record<string, unknown>,
) => DemoRendererInstance;

type DemoRendererInstance = {
  dispose?: () => void;
  destroy?: () => void;
  schematicManager?: {
    loadSchematicFromURL?: (url: string, id: string) => Promise<void>;
  };
  cameraManager?: {
    focusOnSchematics?: () => void;
  };
};

declare global {
  interface Window {
    THREE?: unknown;
    SchematicRenderer?:
      | UmdConstructor
      | {
          SchematicRenderer?: UmdConstructor;
        };
  }
}

const THREE_CDNS = [
  "/vendor/three.min.js",
  "https://unpkg.com/three@0.184.0/build/three.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.min.js",
];

const RENDERER_CDNS = [
  "/vendor/schematic-renderer.umd.js",
  "https://unpkg.com/schematic-renderer@1.1.25/dist/schematic-renderer.umd.js",
  "https://cdn.jsdelivr.net/npm/schematic-renderer@1.1.25/dist/schematic-renderer.umd.js",
];

async function ensureScript(
  url: string,
  testReady: () => boolean,
): Promise<void> {
  if (testReady()) {
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-demo-src="${url}"]`,
  );

  if (existing) {
    await new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
        reject(new Error(`Failed to load script: ${url}`));
      };
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
    });
    return;
  }

  const script = document.createElement("script");
  script.src = url;
  script.async = true;
  script.dataset.demoSrc = url;

  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

async function ensureScriptFromFallbacks(
  urls: string[],
  testReady: () => boolean,
): Promise<void> {
  if (testReady()) {
    return;
  }

  const errors: string[] = [];

  for (const url of urls) {
    try {
      await ensureScript(url, testReady);
      if (testReady()) {
        return;
      }
      errors.push(`Loaded but global missing: ${url}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Failed: ${url}`);
    }
  }

  throw new Error(`Tried all CDNs. ${errors.join(" | ")}`);
}

function getRendererConstructor(): UmdConstructor | null {
  const maybeGlobal = window.SchematicRenderer;

  if (typeof maybeGlobal === "function") {
    return maybeGlobal;
  }

  if (
    maybeGlobal &&
    typeof maybeGlobal === "object" &&
    typeof maybeGlobal.SchematicRenderer === "function"
  ) {
    return maybeGlobal.SchematicRenderer;
  }

  return null;
}

function SchematicRendererDemoModal({
  opened,
  onClose,
  schematicName,
  loadSchematicArrayBuffer,
}: SchematicRendererDemoModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<DemoRendererInstance | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [stage, setStage] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const titleId = useId();

  useEffect(() => {
    if (!opened) {
      return;
    }

    let canceled = false;

    async function initRenderer() {
      setStatus("loading");
      setStage("loading-three");
      setErrorMessage("");

      try {
        await ensureScriptFromFallbacks(
          THREE_CDNS,
          () => typeof window.THREE !== "undefined",
        );
        setStage("loading-renderer");
        await ensureScriptFromFallbacks(
          RENDERER_CDNS,
          () => getRendererConstructor() !== null,
        );

        const RendererCtor = getRendererConstructor();
        const canvas = canvasRef.current;

        if (!RendererCtor || !canvas) {
          throw new Error("Renderer did not initialize correctly.");
        }

        setStage("constructing-renderer");
        const renderer = new RendererCtor(
          canvas,
          {},
          {},
          {
            showGrid: true,
            enableDragAndDrop: false,
            sidebarOptions: {
              enabled: false,
            },
          },
        );

        rendererRef.current = renderer;

        setStage("fetching-schematic");
        const schematicBuffer = await loadSchematicArrayBuffer();
        const schematicBlob = new Blob([schematicBuffer]);
        const schematicUrl = URL.createObjectURL(schematicBlob);

        setStage("loading-schematic");
        if (!renderer.schematicManager?.loadSchematicFromURL) {
          URL.revokeObjectURL(schematicUrl);
          throw new Error(
            "Renderer missing schematicManager.loadSchematicFromURL.",
          );
        }

        try {
          await renderer.schematicManager.loadSchematicFromURL(
            schematicUrl,
            "demo",
          );
        } finally {
          URL.revokeObjectURL(schematicUrl);
        }

        setStage("focusing-camera");
        renderer.cameraManager?.focusOnSchematics?.();

        // Give mesh build one frame before focusing.
        requestAnimationFrame(() => {
          rendererRef.current?.cameraManager?.focusOnSchematics?.();
        });

        if (!canceled) {
          setStatus("ready");
          setStage("ready");
        }
      } catch (error) {
        if (!canceled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Unknown demo error.",
          );
        }
      }
    }

    initRenderer();

    return () => {
      canceled = true;

      const renderer = rendererRef.current;
      rendererRef.current = null;

      try {
        renderer?.dispose?.();
        renderer?.destroy?.();
      } catch {
        // Demo only: teardown failures can be ignored.
      }

      setStatus("idle");
      setStage("idle");
      setErrorMessage("");
    };
  }, [opened, loadSchematicArrayBuffer]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [opened]);

  if (!opened) {
    return null;
  }

  return createPortal(
    <div
      className="schematic-renderer-demo-modal"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="schematic-renderer-demo-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="schematic-renderer-demo-modal__header">
          <h2 id={titleId} className="schematic-renderer-demo-modal__title">
            3D Preview: {schematicName}
          </h2>
          <button
            type="button"
            className="schematic-renderer-demo-modal__close"
            onClick={onClose}
            aria-label="Close preview"
          >
            Close
          </button>
        </div>

        <div className="schematic-renderer-demo-modal__viewport">
          <canvas
            ref={canvasRef}
            className="schematic-renderer-demo-modal__canvas"
            aria-label="Schematic preview canvas"
          />

          {status !== "ready" && (
            <div
              className="schematic-renderer-demo-modal__overlay"
              role="status"
            >
              {status === "loading" && (
                <span>Loading preview ({stage})...</span>
              )}
              {status === "error" && (
                <span>
                  Failed to load preview at step: {stage}. {errorMessage}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default SchematicRendererDemoModal;
