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

function disablePreviewHighlights(renderer: unknown): void {
  const rendererAny = renderer as {
    highlightManager?: {
      update?: (delta: number) => void;
      dispose?: () => void;
    } | null;
  };

  try {
    rendererAny.highlightManager?.dispose?.();
    // Keep highlightManager truthy because renderer's animation loop checks it
    // before rendering each frame.
    rendererAny.highlightManager = {
      update: () => {
        // Intentionally no-op for preview modal.
      },
      dispose: () => {
        // Intentionally no-op for preview modal.
      },
    };
  } catch {
    // Best effort only: highlight internals are optional/runtime-defined.
  }
}

function applyPreviewLightingProfile(renderer: unknown): void {
  const rendererAny = renderer as {
    sceneManager?: {
      getLights?: () => Map<string, { intensity?: number }>;
    };
    renderManager?: {
      disableEffect?: (effectName: string) => void;
    };
  };

  try {
    const lights = rendererAny.sceneManager?.getLights?.();
    const ambientLight = lights?.get("ambientLight");
    const directionalLight = lights?.get("directionalLight");

    if (ambientLight) {
      ambientLight.intensity = 1.05;
    }

    if (directionalLight) {
      directionalLight.intensity = 1.1;
    }

    // Force-disable gamma post effect for modal preview to avoid washed tones.
    rendererAny.renderManager?.disableEffect?.("gammaCorrection");
  } catch {
    // Best effort only: lighting internals are runtime-defined.
  }
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message || error.name || "Unknown Error";
    const cause = error.cause
      ? ` | cause: ${formatUnknownError(error.cause)}`
      : "";
    return `${message}${cause}`;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      reason?: unknown;
      error?: unknown;
      name?: unknown;
    };

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    if (typeof candidate.reason === "string" && candidate.reason.trim()) {
      return candidate.reason;
    }

    if (typeof candidate.error === "string" && candidate.error.trim()) {
      return candidate.error;
    }

    if (typeof candidate.name === "string" && candidate.name.trim()) {
      return candidate.name;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return "Unknown demo error.";
}

function shouldAttemptBlockEntitiesAutoHeal(error: unknown): boolean {
  return formatUnknownError(error).includes('Missing tag "BlockEntities"');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function waitForEnabledPacks(
  getEnabledPacks: () => Array<unknown>,
  timeoutMs = 1200,
  pollMs = 100,
): Promise<Array<unknown>> {
  const startedAt = Date.now();
  let enabled = getEnabledPacks();

  while (enabled.length === 0 && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => {
      setTimeout(resolve, pollMs);
    });
    enabled = getEnabledPacks();
  }

  return enabled;
}

async function patchMissingBlockEntitiesTag(
  schematicBuffer: ArrayBuffer,
): Promise<ArrayBuffer | null> {
  try {
    const { TAG, TAG_TYPE, read, write } = await import("nbtify");
    const nbt = await read(schematicBuffer);
    const root = nbt.data;

    if (!root || typeof root !== "object" || Array.isArray(root)) {
      return null;
    }

    const rootCompound = root as Record<string, unknown>;

    // Schematic v3 expects BlockEntities, even when no block entities exist.
    // Empty NBT lists should carry the intended element type.
    const emptyBlockEntities: unknown[] = [];
    (emptyBlockEntities as unknown as { [key: symbol]: number })[TAG_TYPE] =
      TAG.COMPOUND;

    const candidates: Record<string, unknown>[] = [];
    const visited = new Set<Record<string, unknown>>();

    const visitAll = (node: unknown, depth: number) => {
      if (depth > 8 || !isRecord(node) || visited.has(node)) {
        return;
      }

      visited.add(node);
      candidates.push(node);

      for (const value of Object.values(node)) {
        if (isRecord(value)) {
          visitAll(value, depth + 1);
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (isRecord(item)) {
              visitAll(item, depth + 1);
            }
          }
        }
      }
    };

    visitAll(rootCompound, 0);

    let patchedAny = false;
    for (const candidate of candidates) {
      if (!Object.prototype.hasOwnProperty.call(candidate, "BlockEntities")) {
        const newList = [...emptyBlockEntities];
        (newList as unknown as { [key: symbol]: number })[TAG_TYPE] =
          TAG.COMPOUND;
        candidate.BlockEntities = newList;
        patchedAny = true;
      }

      // Compatibility fallback for parsers expecting the legacy key.
      if (!Object.prototype.hasOwnProperty.call(candidate, "TileEntities")) {
        const legacyList: unknown[] = [];
        (legacyList as unknown as { [key: symbol]: number })[TAG_TYPE] =
          TAG.COMPOUND;
        candidate.TileEntities = legacyList;
        patchedAny = true;
      }
    }

    if (!patchedAny) {
      return null;
    }

    const patched = await write(nbt);
    return new Uint8Array(patched).buffer;
  } catch (error) {
    console.warn(
      "[SchematicRendererModal] BlockEntities auto-heal patch failed",
      error,
    );
    return null;
  }
}

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
  const runIdRef = useRef(0);
  const hasInitializedForOpenRef = useRef(false);
  const loadSchematicArrayBufferRef = useRef(loadSchematicArrayBuffer);

  const titleId = useId();

  useEffect(() => {
    loadSchematicArrayBufferRef.current = loadSchematicArrayBuffer;
  }, [loadSchematicArrayBuffer]);

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

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[SchematicRendererModal] Unhandled promise rejection", {
        reason: event.reason,
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      console.error("[SchematicRendererModal] Window error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const firstArg = args[0];
      if (
        typeof firstArg === "string" &&
        firstArg.includes("[ResourcePackManager] Pack already loaded with id")
      ) {
        return;
      }

      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      hasInitializedForOpenRef.current = false;
      return;
    }

    if (hasInitializedForOpenRef.current) {
      return;
    }
    hasInitializedForOpenRef.current = true;

    let canceled = false;
    const runId = ++runIdRef.current;

    async function initRenderer() {
      setStatus("loading");

      let currentStage = "loading-renderer";
      const updateStage = (nextStage: string) => {
        currentStage = nextStage;
        setStage(nextStage);
      };

      const log = (message: string, data?: Record<string, unknown>) => {
        console.info(`[SchematicRendererModal#${runId}] ${message}`, {
          stage: currentStage,
          ...(data || {}),
        });
      };

      const throwIfCanceled = () => {
        if (canceled) {
          throw new Error("Renderer init canceled");
        }
      };

      updateStage("loading-renderer");
      setErrorMessage("");
      log("init start", { schematicName });

      try {
        // Dynamic import to defer loading until modal opens
        const { SchematicRenderer } = await import("schematic-renderer");
        throwIfCanceled();

        const canvas = canvasRef.current;

        if (!canvas) {
          throw new Error("Canvas ref not available.");
        }

        updateStage("constructing-renderer");

        const renderer = new SchematicRenderer(
          canvas,
          {},
          {},
          {
            showGrid: false,
            enableDragAndDrop: false,
            enableAdaptiveFPS: false,
            targetFPS: 60,
            idleFPS: 60,
            sidebarOptions: {
              enabled: false,
            },
            postProcessingOptions: {
              enabled: false,
              enableSSAO: false,
              enableSMAA: false,
              enableGamma: false,
            },
          },
        );

        rendererRef.current = renderer as RendererType;
        disablePreviewHighlights(renderer);
        applyPreviewLightingProfile(renderer);
        throwIfCanceled();

        updateStage("loading-resource-pack");
        let packBlob = resourcePackBlob;
        if (!packBlob) {
          const packResponse = await fetch(DEFAULT_RESOURCE_PACK_PATH);
          throwIfCanceled();
          if (!packResponse.ok) {
            throw new Error(
              `Resource pack not found at ${DEFAULT_RESOURCE_PACK_PATH} (HTTP ${packResponse.status}).`,
            );
          }
          packBlob = await packResponse.blob();
          throwIfCanceled();
        }

        if (!renderer.packs) {
          throw new Error("Renderer pack manager is not available.");
        }

        // Batch pack updates to avoid repeated expensive rebuild cascades.
        renderer.packs.setPackAutoRebuild?.(false);

        const enabledBefore = await waitForEnabledPacks(() =>
          renderer.packs.getEnabledPacks(),
        );
        if (enabledBefore.length > 0) {
          log("reusing auto-restored resource packs", {
            enabledPackCount: enabledBefore.length,
          });
        } else {
          const allPacks = renderer.packs.getAllPacks?.() ?? [];
          const existingLocalPack = allPacks.find(
            (pack: { id?: string; name?: string }) =>
              pack.id === "local-vanilla" || pack.name === "local-vanilla",
          );

          if (existingLocalPack?.id) {
            await renderer.packs.enablePack?.(existingLocalPack.id);
            throwIfCanceled();
            log("enabled existing local resource pack", {
              packId: existingLocalPack.id,
            });
          } else {
            await renderer.packs.loadPackFromBlob(packBlob, "local-vanilla");
            throwIfCanceled();
            log("fallback local resource pack loaded");
          }

          // Single explicit rebuild after all pack mutations above.
          await renderer.packs.rebuildPackAtlas?.();
          throwIfCanceled();
        }

        // Keep preview stable: no runtime pack mutation/rebuild while user is viewing.
        renderer.packs.setPackAutoRebuild?.(false);

        updateStage("validating-resource-packs");
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

        updateStage("fetching-schematic");
        const schematicBuffer = await loadSchematicArrayBufferRef.current();
        throwIfCanceled();
        log("schematic buffer fetched", { bytes: schematicBuffer.byteLength });

        updateStage("loading-schematic");
        // Use preload method if available, otherwise just initialize renderer
        if (
          renderer.schematicManager &&
          "loadSchematic" in renderer.schematicManager
        ) {
          const loadWithTimeout = async (buffer: ArrayBuffer) => {
            const loadPromise = (
              renderer.schematicManager as any
            ).loadSchematic("demo", buffer);

            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(new Error("loadSchematic timed out after 20s"));
              }, 20000);
            });

            await Promise.race([loadPromise, timeoutPromise]);
          };

          try {
            await loadWithTimeout(schematicBuffer);
            throwIfCanceled();
            log("loadSchematic completed");
          } catch (schematicError) {
            if (shouldAttemptBlockEntitiesAutoHeal(schematicError)) {
              updateStage("repairing-schematic");
              log("attempting one-time BlockEntities auto-heal");

              const patchedBuffer =
                await patchMissingBlockEntitiesTag(schematicBuffer);
              throwIfCanceled();

              if (patchedBuffer) {
                updateStage("loading-schematic-retry");
                await loadWithTimeout(patchedBuffer);
                throwIfCanceled();
                log("loadSchematic completed after BlockEntities auto-heal", {
                  patchedBufferBytes: patchedBuffer.byteLength,
                });
              } else {
                console.warn(
                  "[SchematicRendererModal] BlockEntities auto-heal skipped (no patch produced)",
                );
                throw schematicError;
              }
            } else {
              throw schematicError;
            }
          }
        }

        updateStage("focusing-camera");
        // Re-apply after init path in case library recreated highlight manager.
        disablePreviewHighlights(renderer);
        if (renderer.cameraManager) {
          renderer.cameraManager.focusOnSchematics?.();
        }

        // Give mesh build one frame before focusing.
        requestAnimationFrame(() => {
          rendererRef.current?.cameraManager?.focusOnSchematics?.();
        });

        if (!canceled) {
          setStatus("ready");
          updateStage("ready");
          log("renderer ready");
        }
      } catch (error) {
        if (!canceled) {
          setStatus("error");
          setStage(currentStage);
          setErrorMessage(formatUnknownError(error));
          console.error("[SchematicRendererModal] Preview load failed", {
            stage: currentStage,
            runId,
            schematicName,
            error,
          });
        }
      }
    }

    initRenderer();

    return () => {
      canceled = true;
      hasInitializedForOpenRef.current = false;

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
  }, [opened]);

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
