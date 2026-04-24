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

function normalizeCollectionOption(input: unknown): CollectionOption | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const rawId = record.collection_id ?? record._id ?? record.id;

  if (rawId === null || rawId === undefined) {
    return null;
  }

  const collection_id = String(rawId).trim();
  if (!collection_id) {
    return null;
  }

  const rawName = record.collection_name ?? record.name ?? record.label;
  const collection_name =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim()
      : `Collection ${collection_id}`;

  return {
    collection_id,
    collection_name,
  };
}

type CollectionsResponse = {
  collections?: Collection[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

type CollectionResponse = {
  collection?: CollectionDetail;
  message?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
};

type CreateCollectionResponse = {
  collection?: Collection;
  message?: string;
};

type CollectionOptionsResponse = {
  collections?: CollectionOption[];
};

type AvailableSchematicsResponse = {
  schematics?: Schematic[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  message?: string;
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
  activeCollectionSearchTerm: string;
  activeCollectionPage: number;
  activeCollectionPageSize: number;
  activeCollectionTotalCount: number;
  collectionsPage: number;
  collectionsPageSize: number;
  collectionsTotalCount: number;
  isLoading: boolean;
  isDetailLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  detailError: string | null;
  fetchCollections: (options?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<void>;
  fetchCollectionOptions: () => Promise<CollectionOption[]>;
  fetchSchematicsForSelection: (options?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<{
    schematics: Schematic[];
    totalCount: number;
    page: number;
    pageSize: number;
  } | null>;
  replaceCollectionSchematics: (payload: {
    collectionId: string;
    schematicIds: string[];
  }) => Promise<ActionResult>;
  fetchCollection: (
    collectionId: string,
    options?: { page?: number; pageSize?: number; search?: string },
  ) => Promise<CollectionDetail | null>;
  setActiveCollectionSearchTerm: (term: string) => void;
  setActiveCollectionPage: (page: number) => void;
  resetActiveCollectionQuery: () => void;
  setCollectionsPage: (page: number) => void;
  updateCollection: (
    collectionId: string,
    payload: FormData,
  ) => Promise<ActionResult<CollectionDetail>>;
  createCollection: (payload: FormData) => Promise<ActionResult<Collection>>;
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

let latestCollectionFetchRequestId = 0;
let latestCollectionsFetchRequestId = 0;

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  activeCollection: null,
  collectionOptions: [],
  activeCollectionSearchTerm: "",
  activeCollectionPage: 1,
  activeCollectionPageSize: 100,
  activeCollectionTotalCount: 0,
  collectionsPage: 1,
  collectionsPageSize: 100,
  collectionsTotalCount: 0,
  isLoading: true,
  isDetailLoading: false,
  isSubmitting: false,
  error: null,
  detailError: null,

  fetchCollections: async (options) => {
    const requestId = ++latestCollectionsFetchRequestId;
    const { collectionsPage, collectionsPageSize } = get();
    const targetPage = options?.page ?? collectionsPage;
    const targetPageSize = options?.pageSize ?? collectionsPageSize;
    const targetSearch = options?.search?.trim() ?? "";

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(targetPageSize),
      });

      if (targetSearch) {
        params.set("search", targetSearch);
      }

      const response = await customFetch<CollectionsResponse>(
        `/get-collections?${params.toString()}`,
        "GET",
      );

      if (requestId !== latestCollectionsFetchRequestId) return;

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

      set((state) => ({
        collections: Array.isArray(response.data?.collections)
          ? response.data.collections
          : [],
        collectionsTotalCount: response.data?.totalCount ?? 0,
        collectionsPageSize:
          response.data?.pageSize ?? state.collectionsPageSize,
        isLoading: false,
        error: null,
      }));
    } catch {
      if (requestId !== latestCollectionsFetchRequestId) return;
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
            .map((option) => normalizeCollectionOption(option))
            .filter((option): option is CollectionOption => Boolean(option))
        : [];

      set({ collectionOptions });
      return collectionOptions;
    } catch {
      set({ collectionOptions: [] });
      return [];
    }
  },

  fetchSchematicsForSelection: async (options) => {
    const targetPage = options?.page ?? 1;
    const targetPageSize = options?.pageSize ?? 100;
    const targetSearch = options?.search?.trim() ?? "";

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(targetPageSize),
      });

      if (targetSearch) {
        params.set("search", targetSearch);
      }

      const response = await customFetch<AvailableSchematicsResponse>(
        `/get-schematics?${params.toString()}`,
        "GET",
      );

      if (response.status >= 400) {
        return null;
      }

      return {
        schematics: Array.isArray(response.data?.schematics)
          ? response.data.schematics
          : [],
        totalCount: response.data?.totalCount ?? 0,
        page: response.data?.page ?? targetPage,
        pageSize: response.data?.pageSize ?? targetPageSize,
      };
    } catch {
      return null;
    }
  },

  replaceCollectionSchematics: async ({ collectionId, schematicIds }) => {
    set({ isSubmitting: true });

    try {
      const response = await customFetch<{ message?: string }>(
        `/add-schematics-to-collection/${collectionId}`,
        "POST",
        JSON.stringify({ schematicIds }),
        {
          "Content-Type": "application/json",
        },
      );

      if (![200, 201].includes(response.status)) {
        const message = getMessage(
          "Failed to update collection schematics.",
          response.data,
        );
        set({ isSubmitting: false });
        return { success: false, message };
      }

      set({ isSubmitting: false });
      return {
        success: true,
        message: getMessage(
          "Collection schematics updated successfully.",
          response.data,
        ),
      };
    } catch {
      set({ isSubmitting: false });
      return {
        success: false,
        message: "Failed to update collection schematics.",
      };
    }
  },

  fetchCollection: async (collectionId, options) => {
    const requestId = ++latestCollectionFetchRequestId;

    const {
      activeCollectionPage,
      activeCollectionPageSize,
      activeCollectionSearchTerm,
    } = get();
    const targetPage = options?.page ?? activeCollectionPage;
    const targetPageSize = options?.pageSize ?? activeCollectionPageSize;
    const targetSearch = options?.search ?? activeCollectionSearchTerm;

    set({ isDetailLoading: true, detailError: null });

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(targetPageSize),
      });

      if (targetSearch.trim()) {
        params.set("search", targetSearch.trim());
      }

      const response = await customFetch<CollectionResponse>(
        `/get-collection/${collectionId}?${params.toString()}`,
        "GET",
      );

      if (requestId !== latestCollectionFetchRequestId) {
        return null;
      }

      if (response.status >= 400 || !response.data?.collection) {
        set({
          activeCollection: null,
          isDetailLoading: false,
          activeCollectionTotalCount: 0,
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
        activeCollectionTotalCount:
          response.data?.totalCount ?? collection.schematics.length,
        activeCollectionPageSize:
          response.data?.pageSize ?? state.activeCollectionPageSize,
        collections: upsertCollection(
          state.collections,
          toCollectionSummary(collection),
        ),
        isDetailLoading: false,
        detailError: null,
      }));

      return collection;
    } catch {
      if (requestId !== latestCollectionFetchRequestId) {
        return null;
      }

      set({
        activeCollection: null,
        isDetailLoading: false,
        activeCollectionTotalCount: 0,
        detailError: "Failed to load collection. Please try again.",
      });
      return null;
    }
  },

  setActiveCollectionSearchTerm: (term) => {
    set({ activeCollectionSearchTerm: term, activeCollectionPage: 1 });
  },

  setActiveCollectionPage: (page) => {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    set({ activeCollectionPage: safePage });
  },

  resetActiveCollectionQuery: () => {
    set({
      activeCollectionSearchTerm: "",
      activeCollectionPage: 1,
      activeCollectionTotalCount: 0,
    });
  },

  setCollectionsPage: (page) => {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    set({ collectionsPage: safePage });
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

  createCollection: async (payload) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await customFetch<CreateCollectionResponse>(
        "/add-new-collection",
        "POST",
        payload,
      );

      if (![200, 201].includes(response.status)) {
        const message = getMessage(
          "Failed to add collection. Please try again.",
          response.data,
        );
        set({ isSubmitting: false, error: message });
        return { success: false, message };
      }

      await get().fetchCollections();
      set({ isSubmitting: false, error: null });

      return {
        success: true,
        message: getMessage("Collection added successfully.", response.data),
        data: response.data?.collection,
      };
    } catch {
      const message = "Failed to add collection. Please try again.";
      set({ isSubmitting: false, error: message });
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
        activeCollectionTotalCount: Math.max(
          0,
          state.activeCollectionTotalCount - 1,
        ),
      };
    });
  },

  clearActiveCollection: () => {
    set({
      activeCollection: null,
      activeCollectionSearchTerm: "",
      activeCollectionPage: 1,
      activeCollectionTotalCount: 0,
      detailError: null,
      isDetailLoading: false,
    });
  },
}));
