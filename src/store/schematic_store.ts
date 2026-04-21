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
  allSchematics: Schematic[];
  availableTags: string[];
  searchTerm: string;
  selectedTags: string[];
  isLoading: boolean;
  error: string | null;
  fetchSchematics: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedTags: (tags: string[]) => void;
  clearFilters: () => void;
  removeSchematicLocal: (schematicId: string) => void;
};

function extractAvailableTags(schematics: Schematic[]): string[] {
  const tagSet = new Set<string>();

  schematics.forEach((schematic) => {
    schematic.tags.forEach((tag) => {
      const normalized = tag.trim();
      if (normalized) {
        tagSet.add(normalized);
      }
    });
  });

  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

function filterSchematics(
  schematics: Schematic[],
  searchTerm: string,
  selectedTags: string[],
): Schematic[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return schematics.filter((schematic) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      schematic.name.toLowerCase().includes(normalizedSearch) ||
      schematic.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedSearch),
      );

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((selectedTag) =>
        schematic.tags.some(
          (tag) => tag.toLowerCase() === selectedTag.toLowerCase(),
        ),
      );

    return matchesSearch && matchesTags;
  });
}

export const useSchematicsStore = create<SchematicsState>((set, get) => ({
  schematics: [],
  allSchematics: [],
  availableTags: [],
  searchTerm: "",
  selectedTags: [],
  isLoading: true,
  error: null,
  fetchSchematics: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await customFetch<Schematic[]>("/get-schematics", "GET");

      if (response.status >= 400) {
        set({
          schematics: [],
          allSchematics: [],
          availableTags: [],
          isLoading: false,
          error: "Failed to load schematics. Please try again.",
        });
        return;
      }

      const fetchedSchematics = Array.isArray(response.data)
        ? response.data
        : [];
      const { searchTerm, selectedTags } = get();
      const availableTags = extractAvailableTags(fetchedSchematics);

      set({
        allSchematics: fetchedSchematics,
        schematics: filterSchematics(
          fetchedSchematics,
          searchTerm,
          selectedTags,
        ),
        availableTags,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        schematics: [],
        allSchematics: [],
        availableTags: [],
        isLoading: false,
        error: "Failed to load schematics. Please try again.",
      });
    }
  },
  setSearchTerm: (term) => {
    const { allSchematics, selectedTags } = get();
    set({
      searchTerm: term,
      schematics: filterSchematics(allSchematics, term, selectedTags),
    });
  },
  setSelectedTags: (tags) => {
    const { allSchematics, searchTerm } = get();
    set({
      selectedTags: tags,
      schematics: filterSchematics(allSchematics, searchTerm, tags),
    });
  },
  clearFilters: () => {
    const { allSchematics } = get();
    set({
      searchTerm: "",
      selectedTags: [],
      schematics: allSchematics,
    });
  },
  removeSchematicLocal: (schematicId) => {
    const { allSchematics, searchTerm, selectedTags } = get();
    const nextAllSchematics = allSchematics.filter(
      (schematic) => schematic._id !== schematicId,
    );

    set({
      allSchematics: nextAllSchematics,
      availableTags: extractAvailableTags(nextAllSchematics),
      schematics: filterSchematics(nextAllSchematics, searchTerm, selectedTags),
    });
  },
}));
