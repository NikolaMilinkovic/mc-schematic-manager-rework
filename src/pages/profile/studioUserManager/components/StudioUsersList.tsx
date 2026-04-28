import { Stack, Text } from "@mantine/core";
import StudioUserCard from "./StudioUserCard";
import type { PermissionCategory, StudioManagedUser } from "./types";
import "./studio-users-list.scss";

type StudioUsersListProps = {
  users: StudioManagedUser[];
  activeUsername: string;
  removingCustomId: string | null;
  onFieldChange: (
    userCustomId: string,
    field: "username" | "password",
    value: string,
  ) => void;
  onRemoveUser: (userCustomId: string) => void;
  onPermissionChange: (
    userCustomId: string,
    category: PermissionCategory,
    permission: string,
    checked: boolean,
  ) => void;
};

function StudioUsersList({
  users,
  activeUsername,
  removingCustomId,
  onFieldChange,
  onRemoveUser,
  onPermissionChange,
}: StudioUsersListProps) {
  const visibleUsers = users.filter((user) => user.username !== activeUsername);

  if (visibleUsers.length === 0) {
    return (
      <Text className="studio-users-list__empty">
        No studio users yet. Add one to start assigning permissions.
      </Text>
    );
  }

  return (
    <Stack gap="sm" className="studio-users-list">
      {visibleUsers.map((user) => (
        <StudioUserCard
          key={user.custom_id}
          user={user}
          removingCustomId={removingCustomId}
          onFieldChange={onFieldChange}
          onRemoveUser={onRemoveUser}
          onPermissionChange={onPermissionChange}
        />
      ))}
    </Stack>
  );
}

export default StudioUsersList;
