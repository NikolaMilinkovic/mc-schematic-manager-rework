import { create } from "zustand";
import customFetch from "../lib/custom_fetch";

export type SchematicImage = {
  publicId: string;
  url: string;
};

export type SchematicBlurHash = {
  hash?: string;
  width?: number;
  height?: number;
};

export type Schematic = {
  _id: string;
  name: string;
  tags: string[];
  created_at: string;
  original_file_name?: string;
  file?: unknown;
  fawe_string?: string;
  last_updated?: string;
  image?: SchematicImage;
  blur_hash?: SchematicBlurHash;
};

type SchematicsState = {
  schematics: Schematic[];
  searchTerm: string;
  selectedTags: string[];
  selectedCollectionIds: string[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  fetchSchematics: (page?: number) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedCollectionIds: (collectionIds: string[]) => void;
  clearFilters: () => void;
  removeSchematicLocal: (schematicId: string) => void;
  setPage: (page: number) => void;
};

type SchematicsPageResponse = {
  schematics: Schematic[];
  totalCount: number;
};

export const useSchematicsStore = create<SchematicsState>((set, get) => ({
  schematics: [],
  searchTerm: "",
  selectedTags: [],
  selectedCollectionIds: [],
  isLoading: true,
  error: null,
  currentPage: 1,
  pageSize: 100,
  totalCount: 0,
  fetchSchematics: async (page) => {
    const {
      searchTerm,
      selectedTags,
      selectedCollectionIds,
      pageSize,
      currentPage,
    } = get();
    const targetPage = page ?? currentPage;

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }

      if (selectedCollectionIds.length > 0) {
        params.set("collections", selectedCollectionIds.join(","));
      }

      const response = await customFetch<SchematicsPageResponse>(
        `/get-schematics?${params.toString()}`,
        "GET",
      );

      if (response.status >= 400) {
        set({
          schematics: [],
          isLoading: false,
          error: "Failed to load schematics. Please try again.",
        });
        return;
      }

      const fetchedSchematics = Array.isArray(response.data?.schematics)
        ? response.data.schematics
        : [];

      set({
        schematics: fetchedSchematics,
        totalCount: response.data?.totalCount ?? 0,
        currentPage: targetPage,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        schematics: [],
        isLoading: false,
        error: "Failed to load schematics. Please try again.",
      });
    }
  },
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    void get().fetchSchematics(1);
  },
  setSelectedTags: (tags) => {
    set({ selectedTags: tags });
    void get().fetchSchematics(1);
  },
  setSelectedCollectionIds: (collectionIds) => {
    set({ selectedCollectionIds: collectionIds });
    void get().fetchSchematics(1);
  },
  clearFilters: () => {
    set({ searchTerm: "", selectedTags: [], selectedCollectionIds: [] });
    void get().fetchSchematics(1);
  },
  removeSchematicLocal: (schematicId) => {
    const { schematics, totalCount } = get();
    set({
      schematics: schematics.filter((s) => s._id !== schematicId),
      totalCount: Math.max(0, totalCount - 1),
    });
  },
  setPage: (page) => {
    void get().fetchSchematics(page);
  },
}));
