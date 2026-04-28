import { Checkbox, Divider, SimpleGrid, Stack, Text } from "@mantine/core";
import type { PermissionCategory, StudioManagedUser } from "./types";
import "./studio-user-permissions.scss";

type StudioUserPermissionsProps = {
  user: StudioManagedUser;
  onPermissionChange: (
    userCustomId: string,
    category: PermissionCategory,
    permission: string,
    checked: boolean,
  ) => void;
};

const PERMISSION_SECTIONS: Array<{
  category: PermissionCategory;
  title: string;
  permissions: Array<{ key: string; label: string }>;
}> = [
  {
    category: "schematic",
    title: "Schematics",
    permissions: [
      { key: "get_schematic", label: "View schematics" },
      { key: "edit_schematic", label: "Edit schematics" },
      { key: "download_schematic", label: "Download schematics" },
      { key: "remove_schematic", label: "Delete schematics" },
    ],
  },
  {
    category: "collection",
    title: "Collections",
    permissions: [
      { key: "add_collection", label: "Add collections" },
      { key: "remove_collection", label: "Delete collections" },
      { key: "edit_collection", label: "Edit collections" },
    ],
  },
  {
    category: "profile",
    title: "Profile",
    permissions: [
      { key: "view_profile", label: "View profile" },
      { key: "edit_profile", label: "Edit profile" },
      { key: "studio_user_manager", label: "Manage studio users" },
      { key: "view_user_stats", label: "View user stats" },
    ],
  },
];

function StudioUserPermissions({
  user,
  onPermissionChange,
}: StudioUserPermissionsProps) {
  return (
    <div className="studio-user-permissions">
      <Divider className="studio-user-permissions__divider" />
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
        {PERMISSION_SECTIONS.map((section) => (
          <Stack
            key={`${user.custom_id}-${section.category}`}
            gap="xs"
            className="studio-user-permissions__section"
          >
            <Text className="studio-user-permissions__title">
              {section.title}
            </Text>

            {section.permissions.map((permission) => (
              <Checkbox
                key={`${user.custom_id}-${section.category}-${permission.key}`}
                checked={Boolean(
                  user.permissions[section.category][permission.key],
                )}
                onChange={(event) =>
                  onPermissionChange(
                    user.custom_id,
                    section.category,
                    permission.key,
                    event.currentTarget.checked,
                  )
                }
                label={permission.label}
                radius="xs"
                classNames={{
                  root: "studio-user-permissions__checkbox",
                  label: "studio-user-permissions__checkbox-label",
                }}
              />
            ))}
          </Stack>
        ))}
      </SimpleGrid>
    </div>
  );
}

export default StudioUserPermissions;
