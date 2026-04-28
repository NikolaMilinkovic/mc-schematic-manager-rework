import { useEffect, useRef, useState } from "react";
import type { SchematicRenderer as RendererType } from "schematic-renderer";
import "./schematic-preview.scss";

type SchematicPreviewProps = {
  schematicFile?: File | null;
  loadSchematicArrayBuffer?: (() => Promise<ArrayBuffer>) | null;
  schematicName?: string;
  className?: string;
};

type PreviewStatus = "idle" | "preparing" | "loading" | "ready" | "error";

const DEFAULT_RESOURCE_PACK_PATH = "/vendor/vanilla-resource-pack.zip";

function SchematicPreview({
  schematicFile,
  loadSchematicArrayBuffer,
  schematicName,
  className,
}: SchematicPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<RendererType | null>(null);
  const loadIdRef = useRef(0);

  const [status, setStatus] = useState<PreviewStatus>("preparing");
  const [stage, setStage] = useState("loading-renderer");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRendererReady, setIsRendererReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === viewportRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    async function setupRenderer() {
      setStatus("preparing");
      setStage("loading-renderer");
      setErrorMessage("");

      try {
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
        const packResponse = await fetch(DEFAULT_RESOURCE_PACK_PATH);
        if (!packResponse.ok) {
          throw new Error(
            `Resource pack not found at ${DEFAULT_RESOURCE_PACK_PATH} (HTTP ${packResponse.status}).`,
          );
        }

        const packBlob = await packResponse.blob();

        if (!renderer.packs) {
          throw new Error("Renderer pack manager is not available.");
        }

        await renderer.packs.removeAllPacks();
        await renderer.packs.loadPackFromBlob(packBlob, "local-vanilla");

        setStage("validating-resource-packs");
        const enabledPacks = renderer.packs.getEnabledPacks();
        if (!enabledPacks || enabledPacks.length === 0) {
          throw new Error("No enabled resource packs loaded.");
        }

        if (!canceled) {
          setIsRendererReady(true);
        }
      } catch (error) {
        if (!canceled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unknown renderer bootstrap error.",
          );
        }
      }
    }

    void setupRenderer();

    return () => {
      canceled = true;

      const renderer = rendererRef.current as any;
      rendererRef.current = null;

      try {
        renderer?.dispose?.();
        renderer?.destroy?.();
      } catch {
        // Best effort teardown only.
      }
    };
  }, []);

  useEffect(() => {
    const hasLoader = Boolean(loadSchematicArrayBuffer);
    const hasFile = Boolean(schematicFile);
    const renderer = rendererRef.current as any;

    if (!isRendererReady) {
      return;
    }

    if (!hasLoader && !hasFile) {
      if (renderer?.schematicManager?.removeAllSchematics) {
        void renderer.schematicManager.removeAllSchematics();
      }
      setStatus("idle");
      setStage("idle");
      setErrorMessage("");
      return;
    }

    const currentLoadId = ++loadIdRef.current;

    async function loadSchematic() {
      setStatus("loading");
      setStage("fetching-schematic");
      setErrorMessage("");

      try {
        const renderer = rendererRef.current as any;

        if (!renderer) {
          throw new Error("Renderer not initialized.");
        }

        setStage("clearing-previous");
        if (renderer.schematicManager?.removeAllSchematics) {
          await renderer.schematicManager.removeAllSchematics();
        }

        const buffer = hasLoader
          ? await loadSchematicArrayBuffer!()
          : await schematicFile!.arrayBuffer();

        setStage("loading-schematic");
        if (
          renderer.schematicManager &&
          "loadSchematic" in renderer.schematicManager
        ) {
          await renderer.schematicManager.loadSchematic(
            `preview-${currentLoadId}`,
            buffer,
          );
        }

        setStage("focusing-camera");
        renderer.cameraManager?.focusOnSchematics?.();
        requestAnimationFrame(() => {
          rendererRef.current?.cameraManager?.focusOnSchematics?.();
        });

        if (loadIdRef.current === currentLoadId) {
          setStatus("ready");
          setStage("ready");
        }
      } catch (error) {
        if (loadIdRef.current === currentLoadId) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Unknown preview error.",
          );
        }
      }
    }

    void loadSchematic();
  }, [isRendererReady, loadSchematicArrayBuffer, schematicFile]);

  const classes = ["schematic-preview", className].filter(Boolean).join(" ");
  const previewTitle =
    schematicName?.trim() || schematicFile?.name || "No schematic selected";

  async function toggleFullscreen() {
    if (!viewportRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === viewportRef.current) {
        await document.exitFullscreen();
      } else {
        await viewportRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed", error);
    }
  }

  return (
    <section className={classes} aria-label="Schematic 3D preview">
      <header className="schematic-preview__header">
        <h3 className="schematic-preview__title">3D Overview</h3>
        <span className="schematic-preview__name">{previewTitle}</span>
      </header>

      <div
        ref={viewportRef}
        className={`schematic-preview__viewport${isFullscreen ? " schematic-preview__viewport--fullscreen" : ""}`}
      >
        <canvas
          ref={canvasRef}
          className="schematic-preview__canvas"
          aria-label="Schematic 3D preview canvas"
        />

        <button
          type="button"
          className="schematic-preview__fullscreen-toggle"
          onClick={toggleFullscreen}
          aria-label={
            isFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"
          }
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>

        {status !== "ready" && (
          <div className="schematic-preview__overlay" role="status">
            {status === "idle" && (
              <span>Select a schematic file to start 3D preview.</span>
            )}
            {(status === "preparing" || status === "loading") && (
              <div className="schematic-preview__loading">
                <span className="schematic-preview__spinner" />
                <span>Preparing preview ({stage})...</span>
              </div>
            )}
            {status === "error" && (
              <span>
                Preview failed at step: {stage}. {errorMessage}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default SchematicPreview;
