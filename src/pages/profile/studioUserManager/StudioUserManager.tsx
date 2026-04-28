import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import customFetch from "../../../lib/custom_fetch";
import { popupMessage } from "../../../lib/popupMessage";
import {
  selectActiveUser,
  type ActiveUser,
  useUserStore,
} from "../../../store/user_store";
import StudioUsersList from "./components/StudioUsersList";
import type {
  PermissionCategory,
  StudioManagedUser,
  StudioUserPermissions,
} from "./components/types";
import "./studioUserManager.scss";

type ProfileUser = {
  _id?: string;
  username?: string;
};

type GetAllStudioUsersResponse = {
  studio?: {
    users?: StudioManagedUser[];
  };
};

type ResponseMessage = {
  message?: string;
};

function asProfileUser(user: ActiveUser | null): ProfileUser {
  if (!user || typeof user !== "object") {
    return {};
  }

  return user as ProfileUser;
}

function createDefaultPermissions(): StudioUserPermissions {
  return {
    schematic: {
      get_schematic: true,
      edit_schematic: true,
      download_schematic: true,
      remove_schematic: false,
    },
    collection: {
      add_collection: true,
      remove_collection: false,
      edit_collection: true,
    },
    profile: {
      view_profile: true,
      edit_profile: true,
      studio_user_manager: false,
      view_user_stats: false,
    },
  };
}

function toBooleanRecord(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, currentValue]) => {
      return typeof currentValue === "boolean";
    }),
  ) as Record<string, boolean>;
}

function normalizeStudioUser(user: StudioManagedUser): StudioManagedUser {
  const basePermissions = createDefaultPermissions();
  const inputPermissions = user.permissions ?? basePermissions;

  return {
    custom_id: user.custom_id || crypto.randomUUID(),
    username: user.username ?? "",
    password: user.password ?? "",
    role: user.role ?? "studio_user",
    session_id: user.session_id ?? "",
    created_at: user.created_at ?? new Date().toISOString(),
    parent_user_id: user.parent_user_id ?? "",
    avatar: user.avatar ?? {
      publicId: "mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg",
      url: "https://res.cloudinary.com/dm7ymtpki/image/upload/v1717774667/mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg.jpg",
    },
    permissions: {
      schematic: {
        ...basePermissions.schematic,
        ...toBooleanRecord(inputPermissions.schematic),
      },
      collection: {
        ...basePermissions.collection,
        ...toBooleanRecord(inputPermissions.collection),
      },
      profile: {
        ...basePermissions.profile,
        ...toBooleanRecord(inputPermissions.profile),
      },
    },
  };
}

function createDefaultStudioUser(parentUserId: string): StudioManagedUser {
  const customId = crypto.randomUUID();
  const idSegment = customId.slice(0, 8);

  return {
    custom_id: customId,
    username: `studio_user_${idSegment}`,
    password: `temp-${idSegment}`,
    role: "studio_user",
    session_id: "this user hasnt logged in yet",
    created_at: new Date().toISOString(),
    parent_user_id: parentUserId,
    avatar: {
      publicId: "mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg",
      url: "https://res.cloudinary.com/dm7ymtpki/image/upload/v1717774667/mc-schematic-manager-images/xbcldkvm8tpj3dri4jgg.jpg",
    },
    permissions: createDefaultPermissions(),
  };
}

function StudioUserManager() {
  const activeUserRaw = useUserStore(selectActiveUser);
  const setActiveUser = useUserStore((state) => state.setActiveUser);
  const activeUser = useMemo(
    () => asProfileUser(activeUserRaw),
    [activeUserRaw],
  );

  const [studioUsers, setStudioUsers] = useState<StudioManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingUsers, setIsSavingUsers] = useState(false);
  const [removingCustomId, setRemovingCustomId] = useState<string | null>(null);
  const persistedCustomIdsRef = useRef<Set<string>>(new Set());

  const loadStudioUsers = useCallback(async () => {
    if (!activeUser._id) {
      setStudioUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await customFetch<GetAllStudioUsersResponse>(
        "/get-all-studio-users",
        "GET",
      );

      if (response.status !== 200) {
        popupMessage("Could not load studio users.", "error");
        return;
      }

      const users = response.data?.studio?.users;
      if (!Array.isArray(users)) {
        setStudioUsers([]);
        return;
      }

      const normalizedUsers = users.map((user) => normalizeStudioUser(user));
      persistedCustomIdsRef.current = new Set(
        normalizedUsers.map((user) => user.custom_id),
      );
      setStudioUsers(normalizedUsers);
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error loading studio users.", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [activeUser._id]);

  useEffect(() => {
    void loadStudioUsers();
  }, [loadStudioUsers]);

  async function refreshActiveUserData() {
    const userResponse = await customFetch<ActiveUser>("/get-user-data", "GET");
    if (userResponse.status === 200) {
      setActiveUser(userResponse.data);
      return;
    }

    popupMessage("There was an error refreshing user data.", "error");
  }

  function handleAddNewUser() {
    if (!activeUser._id) {
      popupMessage("Missing parent user ID.", "error");
      return;
    }

    setStudioUsers((previous) => [
      ...previous,
      createDefaultStudioUser(activeUser._id ?? ""),
    ]);
  }

  function handleFieldChange(
    userCustomId: string,
    field: "username" | "password",
    value: string,
  ) {
    setStudioUsers((previous) =>
      previous.map((user) => {
        if (user.custom_id !== userCustomId) {
          return user;
        }

        return {
          ...user,
          [field]: value,
        };
      }),
    );
  }

  function handlePermissionChange(
    userCustomId: string,
    category: PermissionCategory,
    permission: string,
    checked: boolean,
  ) {
    setStudioUsers((previous) =>
      previous.map((user) => {
        if (user.custom_id !== userCustomId) {
          return user;
        }

        return {
          ...user,
          permissions: {
            ...user.permissions,
            [category]: {
              ...user.permissions[category],
              [permission]: checked,
            },
          },
        };
      }),
    );
  }

  async function handleRemoveUser(userCustomId: string) {
    const isLocalOnlyUser = !persistedCustomIdsRef.current.has(userCustomId);
    if (isLocalOnlyUser) {
      setStudioUsers((previous) =>
        previous.filter((user) => user.custom_id !== userCustomId),
      );
      popupMessage("Unsaved studio user removed.", "info");
      return;
    }

    setRemovingCustomId(userCustomId);

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const response = await customFetch<ResponseMessage>(
        "/remove-studio-user",
        "POST",
        JSON.stringify({ customId: userCustomId }),
        headers,
      );

      if (response.status === 200) {
        popupMessage(
          response.data.message ?? "Studio user removed.",
          "success",
        );
        setStudioUsers((previous) =>
          previous.filter((user) => user.custom_id !== userCustomId),
        );
        await refreshActiveUserData();
        return;
      }

      popupMessage(
        response.data.message ?? "Failed to remove studio user.",
        "error",
      );
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error removing studio user.", "error");
    } finally {
      setRemovingCustomId(null);
    }
  }

  async function handleSaveUsers() {
    setIsSavingUsers(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const response = await customFetch<ResponseMessage>(
        "/update-studio-users",
        "POST",
        JSON.stringify(studioUsers),
        headers,
      );

      if (response.status === 200) {
        popupMessage(
          response.data.message ?? "Studio users updated.",
          "success",
        );
        await refreshActiveUserData();
        await loadStudioUsers();
        return;
      }

      popupMessage(
        response.data.message ?? "Failed to save studio users.",
        "error",
      );
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error saving studio users.", "error");
    } finally {
      setIsSavingUsers(false);
    }
  }

  return (
    <section className="studio-user-manager">
      <Stack gap="md">
        <Text className="studio-user-manager__note">
          Create, edit, and permission your studio users before saving changes.
        </Text>

        {isLoadingUsers ? (
          <Group justify="center" py="sm">
            <Loader size="sm" />
          </Group>
        ) : (
          <StudioUsersList
            users={studioUsers}
            activeUsername={activeUser.username ?? ""}
            removingCustomId={removingCustomId}
            onFieldChange={handleFieldChange}
            onRemoveUser={handleRemoveUser}
            onPermissionChange={handlePermissionChange}
          />
        )}

        <Group
          justify="flex-end"
          gap="sm"
          className="studio-user-manager__actions"
        >
          <Button
            type="button"
            radius="xs"
            variant="light"
            onClick={handleAddNewUser}
            className="studio-user-manager__button studio-user-manager__button--secondary"
          >
            Add New
          </Button>
          <Button
            type="button"
            radius="xs"
            loading={isSavingUsers}
            onClick={handleSaveUsers}
            className="studio-user-manager__button studio-user-manager__button--primary"
          >
            Save All
          </Button>
        </Group>
      </Stack>
    </section>
  );
}

export default StudioUserManager;
