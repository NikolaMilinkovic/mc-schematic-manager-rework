export type PermissionCategory = "schematic" | "collection" | "profile";

export type StudioUserPermissions = {
  schematic: Record<string, boolean>;
  collection: Record<string, boolean>;
  profile: Record<string, boolean>;
};

export type StudioManagedUser = {
  custom_id: string;
  username: string;
  password: string;
  role: string;
  session_id: string;
  created_at: string;
  parent_user_id: string;
  avatar: {
    publicId: string;
    url: string;
  };
  permissions: StudioUserPermissions;
};
