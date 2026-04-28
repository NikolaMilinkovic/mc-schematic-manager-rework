import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SchematicRenderer as RendererType } from "schematic-renderer";
import "./schematic-renderer-modal.scss";

type SchematicRendererModalProps = {
  opened: boolean;
  onClose: () => void;
  schematicName: string;
  loadSchematicArrayBuffer: () => Promise<ArrayBuffer>;
  resourcePackBlob?: Blob | null;
};

const DEFAULT_RESOURCE_PACK_PATH = "/vendor/vanilla-resource-pack.zip";

function SchematicRendererModal({
  opened,
  onClose,
  schematicName,
  loadSchematicArrayBuffer,
  resourcePackBlob,
}: SchematicRendererModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RendererType | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [stage, setStage] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleId = useId();

  useEffect(() => {
    if (opened) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setIsVisible(true);
    } else if (isVisible) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    let canceled = false;

    async function initRenderer() {
      setStatus("loading");
      setStage("loading-renderer");
      setErrorMessage("");

      try {
        // Dynamic import to defer loading until modal opens
        const { SchematicRenderer } = await import("schematic-renderer");

        const canvas = canvasRef.current;

        if (!canvas) {
          throw new Error("Canvas ref not available.");
        }

        setStage("constructing-renderer");

        const renderer = new SchematicRenderer(
          canvas,
          {},
          {},
          {
            showGrid: false,
            enableDragAndDrop: false,
            sidebarOptions: {
              enabled: false,
            },
          },
        );

        rendererRef.current = renderer as RendererType;

        setStage("loading-resource-pack");
        let packBlob = resourcePackBlob;
        if (!packBlob) {
          const packResponse = await fetch(DEFAULT_RESOURCE_PACK_PATH);
          if (!packResponse.ok) {
            throw new Error(
              `Resource pack not found at ${DEFAULT_RESOURCE_PACK_PATH} (HTTP ${packResponse.status}).`,
            );
          }
          packBlob = await packResponse.blob();
        }

        if (!renderer.packs) {
          throw new Error("Renderer pack manager is not available.");
        }

        // Clear stale packs from IndexedDB, then load explicit local pack.
        await renderer.packs.removeAllPacks();
        await renderer.packs.loadPackFromBlob(packBlob, "local-vanilla");

        setStage("validating-resource-packs");
        const enabledPacks = renderer.packs.getEnabledPacks();
        if (!enabledPacks || enabledPacks.length === 0) {
          const allPacks = renderer.packs.getAllPacks();
          const packSummary = allPacks
            .map((pack) => `${pack.name}(enabled=${pack.enabled})`)
            .join(", ");
          throw new Error(
            `No enabled resource packs loaded from ${DEFAULT_RESOURCE_PACK_PATH}. Found: ${packSummary || "none"}.`,
          );
        }

        setStage("fetching-schematic");
        const schematicBuffer = await loadSchematicArrayBuffer();

        setStage("loading-schematic");
        // Use preload method if available, otherwise just initialize renderer
        if (
          renderer.schematicManager &&
          "loadSchematic" in renderer.schematicManager
        ) {
          await (renderer.schematicManager as any).loadSchematic(
            "demo",
            schematicBuffer,
          );
        }

        setStage("focusing-camera");
        if (renderer.cameraManager) {
          renderer.cameraManager.focusOnSchematics?.();
        }

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

      const renderer = rendererRef.current as any;
      rendererRef.current = null;

      try {
        renderer?.dispose?.();
        renderer?.destroy?.();
      } catch {
        // Modal only: teardown failures can be ignored.
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

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      className={`schematic-renderer-modal${isClosing ? " schematic-renderer-modal--closing" : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`schematic-renderer-modal__dialog${isClosing ? " schematic-renderer-modal__dialog--closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="schematic-renderer-modal__header">
          <h2 id={titleId} className="schematic-renderer-modal__title">
            3D Preview: {schematicName}
          </h2>
          <button
            type="button"
            className="schematic-renderer-modal__close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="schematic-renderer-modal__viewport">
          <canvas
            ref={canvasRef}
            className="schematic-renderer-modal__canvas"
            aria-label="Schematic preview canvas"
          />

          {status !== "ready" && (
            <div className="schematic-renderer-modal__overlay" role="status">
              {status === "loading" && (
                <div className="schematic-renderer-modal__loading">
                  <div className="schematic-renderer-modal__spinner" />
                  <span>Loading preview ({stage})...</span>
                </div>
              )}
              {status === "error" && (
                <div className="schematic-renderer-modal__error">
                  <span>
                    Failed to load preview at step: {stage}. {errorMessage}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default SchematicRendererModal;
