import { useEffect, useRef, useState } from "react";
import type { SchematicRenderer as RendererType } from "schematic-renderer";
import "./schematic-renderer-inline.scss";

type SchematicRendererInlineProps = {
  schematicFile: File | null;
  schematicName?: string;
  className?: string;
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
    rendererAny.highlightManager = {
      update: () => {},
      dispose: () => {},
    };
  } catch {
    // Best effort only.
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

    rendererAny.renderManager?.disableEffect?.("gammaCorrection");
  } catch {
    // Best effort only.
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

  return "Unknown preview error.";
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

async function waitForAnimationFrames(frameCount = 1): Promise<void> {
  for (let index = 0; index < frameCount; index += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

async function waitForCanvasReady(
  canvas: HTMLCanvasElement,
  timeoutMs = 3000,
  pollMs = 50,
): Promise<void> {
  const startedAt = Date.now();

  while (
    (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) &&
    Date.now() - startedAt < timeoutMs
  ) {
    await new Promise((resolve) => {
      setTimeout(resolve, pollMs);
    });
  }
}

async function waitForSchematicMeshesReady(
  renderer: RendererType,
  timeoutMs = 20000,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const schematics = renderer.schematicManager?.getAllSchematics?.() ?? [];
    const firstSchematic = schematics[0] as
      | {
          getMeshes?: () => Promise<unknown>;
          group?: { children?: unknown[] };
        }
      | undefined;

    if (firstSchematic) {
      if (firstSchematic.getMeshes) {
        const getMeshesPromise = firstSchematic.getMeshes();
        const getMeshesTimeout = new Promise<void>((resolve) => {
          setTimeout(resolve, 1200);
        });

        await Promise.race([getMeshesPromise, getMeshesTimeout]);
      }

      if ((firstSchematic.group?.children?.length ?? 0) > 0) {
        return;
      }
    }

    await waitForAnimationFrames(1);
  }

  throw new Error("Timed out waiting for schematic meshes to become ready");
}

type SchematicManagerForInline = {
  loadSchematic: (name: string, buffer: ArrayBuffer) => Promise<void>;
  removeAllSchematics?: () => Promise<void>;
};

async function waitForSchematicManager(
  renderer: RendererType,
  timeoutMs = 8000,
  pollMs = 80,
): Promise<SchematicManagerForInline> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const manager = renderer.schematicManager as
      | SchematicManagerForInline
      | undefined;

    if (manager && typeof manager.loadSchematic === "function") {
      return manager;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, pollMs);
    });
  }

  throw new Error("Renderer schematic manager is not available.");
}

async function focusCameraWithRetry(renderer: RendererType): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await Promise.resolve(renderer.cameraManager?.focusOnSchematics?.());
    await waitForAnimationFrames(2);

    const schematics = renderer.schematicManager?.getAllSchematics?.() ?? [];
    const firstSchematic = schematics[0] as
      | { group?: { children?: unknown[] } }
      | undefined;

    if ((firstSchematic?.group?.children?.length ?? 0) > 0) {
      return;
    }
  }
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
      "[SchematicRendererInline] BlockEntities auto-heal patch failed",
      error,
    );
    return null;
  }
}

function SchematicRendererInline({
  schematicFile,
  schematicName,
  className,
}: SchematicRendererInlineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RendererType | null>(null);
  const runIdRef = useRef(0);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [stage, setStage] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!schematicFile) {
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
  }, [schematicFile]);

  useEffect(() => {
    if (!schematicFile) {
      const renderer = rendererRef.current as any;
      rendererRef.current = null;

      try {
        renderer?.dispose?.();
        renderer?.destroy?.();
      } catch {
        // Best effort teardown.
      }

      setStatus("idle");
      setStage("idle");
      setErrorMessage("");
      return;
    }

    let canceled = false;
    const runId = ++runIdRef.current;
    const fileSnapshot = schematicFile;

    async function initRenderer() {
      setStatus("loading");

      let currentStage = "loading-renderer";
      const updateStage = (next: string) => {
        currentStage = next;
        setStage(next);
      };

      const throwIfCanceled = () => {
        if (canceled) {
          throw new Error("Renderer init canceled");
        }
      };

      updateStage("loading-renderer");
      setErrorMessage("");

      try {
        const { SchematicRenderer } = await import("schematic-renderer");
        throwIfCanceled();

        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas ref not available.");
        }

        await waitForCanvasReady(canvas);
        throwIfCanceled();

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

        if (!renderer.packs) {
          throw new Error("Renderer pack manager is not available.");
        }

        renderer.packs.setPackAutoRebuild?.(false);

        const enabledBefore = await waitForEnabledPacks(() =>
          renderer.packs.getEnabledPacks(),
        );

        if (enabledBefore.length === 0) {
          const allPacks = renderer.packs.getAllPacks?.() ?? [];
          const existingLocalPack = allPacks.find(
            (pack: { id?: string; name?: string }) =>
              pack.id === "local-vanilla" || pack.name === "local-vanilla",
          );

          if (existingLocalPack?.id) {
            await renderer.packs.enablePack?.(existingLocalPack.id);
            throwIfCanceled();
          } else {
            const packResponse = await fetch(DEFAULT_RESOURCE_PACK_PATH);
            throwIfCanceled();

            if (!packResponse.ok) {
              throw new Error(
                `Resource pack not found at ${DEFAULT_RESOURCE_PACK_PATH} (HTTP ${packResponse.status}).`,
              );
            }

            const packBlob = await packResponse.blob();
            throwIfCanceled();

            await renderer.packs.loadPackFromBlob(packBlob, "local-vanilla");
            throwIfCanceled();
          }

          await renderer.packs.rebuildPackAtlas?.();
          throwIfCanceled();
        }

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
        const schematicBuffer = await fileSnapshot.arrayBuffer();
        throwIfCanceled();

        let effectiveSchematicBuffer = schematicBuffer;

        const loadWithTimeout = async (buffer: ArrayBuffer) => {
          const schematicManager = await waitForSchematicManager(
            renderer as RendererType,
          );

          const loadPromise = schematicManager.loadSchematic("preview", buffer);

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error("loadSchematic timed out after 20s"));
            }, 20000);
          });

          await Promise.race([loadPromise, timeoutPromise]);
        };

        updateStage("loading-schematic");

        try {
          await loadWithTimeout(schematicBuffer);
          throwIfCanceled();
        } catch (schematicError) {
          if (shouldAttemptBlockEntitiesAutoHeal(schematicError)) {
            updateStage("repairing-schematic");

            const patchedBuffer =
              await patchMissingBlockEntitiesTag(schematicBuffer);
            throwIfCanceled();

            if (patchedBuffer) {
              effectiveSchematicBuffer = patchedBuffer;
              updateStage("loading-schematic-retry");
              await loadWithTimeout(patchedBuffer);
              throwIfCanceled();
            } else {
              throw schematicError;
            }
          } else {
            throw schematicError;
          }
        }

        updateStage("waiting-mesh-build");

        try {
          await waitForSchematicMeshesReady(renderer as RendererType);
        } catch (meshWaitError) {
          const msg = formatUnknownError(meshWaitError);

          if (!msg.includes("Timed out waiting for schematic")) {
            throw meshWaitError;
          }

          updateStage("recovering-mesh-build");

          await renderer.packs.rebuildPackAtlas?.();
          throwIfCanceled();

          const schematicManager = await waitForSchematicManager(
            renderer as RendererType,
          );
          await schematicManager.removeAllSchematics?.();
          throwIfCanceled();

          await loadWithTimeout(effectiveSchematicBuffer);
          throwIfCanceled();

          await waitForSchematicMeshesReady(renderer as RendererType, 30000);
        }

        throwIfCanceled();

        updateStage("focusing-camera");
        disablePreviewHighlights(renderer);
        await focusCameraWithRetry(renderer as RendererType);
        throwIfCanceled();

        if (!canceled) {
          setStatus("ready");
          updateStage("ready");
        }
      } catch (error) {
        if (!canceled) {
          setStatus("error");
          setStage(currentStage);
          setErrorMessage(formatUnknownError(error));
          console.error("[SchematicRendererInline] Preview load failed", {
            stage: currentStage,
            runId,
            error,
          });
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
        // Best effort teardown.
      }

      setStatus("idle");
      setStage("idle");
      setErrorMessage("");
    };
  }, [schematicFile]);

  const previewTitle =
    schematicName?.trim() || schematicFile?.name || "No schematic selected";

  const classes = ["schematic-renderer-inline", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} aria-label="Schematic 3D preview">
      <header className="schematic-renderer-inline__header">
        <h3 className="schematic-renderer-inline__title">3D Preview</h3>
        <span className="schematic-renderer-inline__name">{previewTitle}</span>
      </header>

      <div className="schematic-renderer-inline__viewport">
        <canvas
          ref={canvasRef}
          className="schematic-renderer-inline__canvas"
          aria-label="Schematic 3D preview canvas"
        />

        {status !== "ready" && (
          <div className="schematic-renderer-inline__overlay" role="status">
            {status === "idle" && (
              <span>Select a schematic file to start 3D preview.</span>
            )}
            {status === "loading" && (
              <div className="schematic-renderer-inline__loading">
                <div className="schematic-renderer-inline__spinner" />
                <span>Loading preview ({stage})...</span>
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

export default SchematicRendererInline;
