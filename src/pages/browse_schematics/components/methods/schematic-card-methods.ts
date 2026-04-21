import customFetch from "../../../../lib/custom_fetch";
import { popupMessage } from "../../../../lib/popupMessage";

type DownloadSchematicParams = {
  schematicId: string;
  schematicName: string;
  originalFileName?: string;
};

export async function downloadSchematicAction({
  schematicId,
  schematicName,
  originalFileName,
}: DownloadSchematicParams): Promise<boolean> {
  try {
    const response = await customFetch<Response>(
      `/get-schematic-file/${schematicId}`,
      "GET",
    );

    if (!(response.data instanceof Response) || !response.data.ok) {
      popupMessage("Failed to download schematic.", "error");
      return false;
    }

    const blob = await response.data.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      originalFileName ?? `${schematicName.replaceAll(" ", "-")}.schem`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    popupMessage("Download started.", "success");
    return true;
  } catch {
    popupMessage("Failed to download schematic.", "error");
    return false;
  }
}

export async function copySchematicStringAction(
  schematicId: string,
): Promise<boolean> {
  try {
    const response = await customFetch<Response>(
      `/get-schematic-fawe-string/${schematicId}`,
      "GET",
    );

    let displayUrl = "";
    if (response.data instanceof Response) {
      displayUrl = await response.data.text();
    } else if (typeof response.data === "string") {
      displayUrl = response.data;
    }

    if (!displayUrl.trim()) {
      popupMessage("Failed to get schematic string.", "error");
      return false;
    }

    await navigator.clipboard.writeText(displayUrl);
    popupMessage("Schematic copied to clipboard.", "success");
    return true;
  } catch {
    popupMessage("Failed to copy schematic string.", "error");
    return false;
  }
}

export async function deleteSchematicAction(
  schematicId: string,
): Promise<boolean> {
  try {
    const response = await customFetch<unknown>(
      `/remove-schematic/${schematicId}`,
      "GET",
    );

    if (response.status === 200 || response.status === 201) {
      popupMessage("Schematic deleted.", "success");
      return true;
    }

    popupMessage("Failed to delete schematic.", "error");
    return false;
  } catch {
    popupMessage("Failed to delete schematic.", "error");
    return false;
  }
}

export async function removeSchematicFromCollectionAction(
  schematicId: string,
  collectionId: string,
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("collectionId", collectionId);

    const response = await customFetch<unknown>(
      `/remove-schematic-from-collection/${schematicId}`,
      "POST",
      formData,
    );

    if (response.status === 200 || response.status === 201) {
      popupMessage("Schematic removed from collection.", "success");
      return true;
    }

    popupMessage("Failed to remove schematic from collection.", "error");
    return false;
  } catch {
    popupMessage("Failed to remove schematic from collection.", "error");
    return false;
  }
}
