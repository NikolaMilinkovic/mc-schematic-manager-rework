import { create } from "zustand";
import customFetch from "../lib/custom_fetch";
import type { Schematic } from "./schematic_store";

export interface CollectionImage {
  publicId: string;
  url: string;
}

export interface CollectionBlurHash {
  hash?: string;
  width?: number;
  height?: number;
}

export interface Collection {
  _id: string;
  name: string;
  tags: string[];
  created_at: string;
  last_updated?: string;
  schematics?: Array<Schematic | string>;
  image: CollectionImage;
  blur_hash?: CollectionBlurHash;
}

export interface CollectionDetail extends Omit<Collection, "schematics"> {
  schematics: Schematic[];
}

export interface CollectionOption {
  collection_id: string;
  collection_name: string;
}

type CollectionsResponse = {
  collections?: Collection[];
  message?: string;
};

type CollectionResponse = {
  collection?: CollectionDetail;
  message?: string;
};

type CollectionOptionsResponse = {
  collections?: CollectionOption[];
};

type ActionResult<TData = void> = {
  success: boolean;
  message: string;
  data?: TData;
};

interface CollectionsState {
  collections: Collection[];
  activeCollection: CollectionDetail | null;
  collectionOptions: CollectionOption[];
  isLoading: boolean;
  isDetailLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  detailError: string | null;
  fetchCollections: () => Promise<void>;
  fetchCollectionOptions: () => Promise<CollectionOption[]>;
  fetchCollection: (collectionId: string) => Promise<CollectionDetail | null>;
  updateCollection: (
    collectionId: string,
    payload: FormData,
  ) => Promise<ActionResult<CollectionDetail>>;
  setCollections: (collections: Collection[]) => void;
  removeCollectionLocal: (collectionId: string) => void;
  removeCollection: (collectionId: string) => Promise<ActionResult>;
  removeSchematicFromActiveCollection: (schematicId: string) => void;
  clearActiveCollection: () => void;
}

function getMessage(
  fallbackMessage: string,
  data?: { message?: string },
): string {
  return data?.message?.trim() || fallbackMessage;
}

function toCollectionSummary(collection: CollectionDetail): Collection {
  return {
    _id: collection._id,
    name: collection.name,
    tags: collection.tags,
    created_at: collection.created_at,
    last_updated: collection.last_updated,
    schematics: collection.schematics,
    image: collection.image,
    blur_hash: collection.blur_hash,
  };
}

function upsertCollection(
  collections: Collection[],
  collection: Collection,
): Collection[] {
  const existingIndex = collections.findIndex(
    (item) => item._id === collection._id,
  );

  if (existingIndex === -1) {
    return [collection, ...collections];
  }

  return collections.map((item, index) =>
    index === existingIndex ? collection : item,
  );
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  activeCollection: null,
  collectionOptions: [],
  isLoading: true,
  isDetailLoading: false,
  isSubmitting: false,
  error: null,
  detailError: null,

  fetchCollections: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await customFetch<CollectionsResponse>(
        "/get-collections",
        "GET",
      );

      if (response.status >= 400) {
        set({
          collections: [],
          isLoading: false,
          error: getMessage(
            "Failed to load collections. Please try again.",
            response.data,
          ),
        });
        return;
      }

      set({
        collections: Array.isArray(response.data?.collections)
          ? response.data.collections
          : [],
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        collections: [],
        isLoading: false,
        error: "Failed to load collections. Please try again.",
      });
    }
  },

  fetchCollectionOptions: async () => {
    try {
      const response = await customFetch<CollectionOptionsResponse>(
        "/get-collections-list",
        "GET",
      );

      const collectionOptions = Array.isArray(response.data?.collections)
        ? response.data.collections
        : [];

      set({ collectionOptions });
      return collectionOptions;
    } catch {
      set({ collectionOptions: [] });
      return [];
    }
  },

  fetchCollection: async (collectionId) => {
    set({ isDetailLoading: true, detailError: null });

    try {
      const response = await customFetch<CollectionResponse>(
        `/get-collection/${collectionId}`,
        "GET",
      );

      if (response.status >= 400 || !response.data?.collection) {
        set({
          activeCollection: null,
          isDetailLoading: false,
          detailError: getMessage(
            "Failed to load collection. Please try again.",
            response.data,
          ),
        });
        return null;
      }

      const collection = response.data.collection;

      set((state) => ({
        activeCollection: collection,
        collections: upsertCollection(
          state.collections,
          toCollectionSummary(collection),
        ),
        isDetailLoading: false,
        detailError: null,
      }));

      return collection;
    } catch {
      set({
        activeCollection: null,
        isDetailLoading: false,
        detailError: "Failed to load collection. Please try again.",
      });
      return null;
    }
  },

  updateCollection: async (collectionId, payload) => {
    set({ isSubmitting: true, detailError: null });

    try {
      const response = await customFetch<CollectionResponse>(
        `/update-collection/${collectionId}`,
        "POST",
        payload,
      );

      if (![200, 201, 304].includes(response.status)) {
        const message = getMessage(
          "Failed to update collection.",
          response.data,
        );
        set({ isSubmitting: false, detailError: message });
        return { success: false, message };
      }

      const refreshedCollection = await get().fetchCollection(collectionId);
      set({ isSubmitting: false });

      return {
        success: true,
        message: "Collection updated successfully.",
        data: refreshedCollection ?? undefined,
      };
    } catch {
      const message = "Failed to update collection.";
      set({ isSubmitting: false, detailError: message });
      return { success: false, message };
    }
  },

  setCollections: (collections) => {
    set({ collections });
  },

  removeCollectionLocal: (collectionId) => {
    set((state) => ({
      collections: state.collections.filter(
        (collection) => collection._id !== collectionId,
      ),
      activeCollection:
        state.activeCollection?._id === collectionId
          ? null
          : state.activeCollection,
    }));
  },

  removeCollection: async (collectionId) => {
    set({ isSubmitting: true });

    try {
      const response = await customFetch<{ message?: string }>(
        `/remove-collection/${collectionId}`,
        "POST",
      );

      if (response.status !== 200) {
        const message = getMessage(
          "Failed to remove collection.",
          response.data,
        );
        set({ isSubmitting: false });
        return { success: false, message };
      }

      get().removeCollectionLocal(collectionId);
      set({ isSubmitting: false });
      return { success: true, message: "Collection removed successfully." };
    } catch {
      set({ isSubmitting: false });
      return { success: false, message: "Failed to remove collection." };
    }
  },

  removeSchematicFromActiveCollection: (schematicId) => {
    set((state) => {
      if (!state.activeCollection) {
        return state;
      }

      return {
        activeCollection: {
          ...state.activeCollection,
          schematics: state.activeCollection.schematics.filter(
            (schematic) => schematic._id !== schematicId,
          ),
        },
      };
    });
  },

  clearActiveCollection: () => {
    set({ activeCollection: null, detailError: null, isDetailLoading: false });
  },
}));
