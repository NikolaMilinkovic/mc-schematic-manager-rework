import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Divider,
  FileButton,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import AuthenticatedPageBackground from "../../components/authenticatedPageBackground/AuthenticatedPageBackground";
import customFetch from "../../lib/custom_fetch";
import { compressImage } from "../../lib/imageUtils";
import { popupMessage } from "../../lib/popupMessage";
import StudioUserManager from "./studioUserManager/StudioUserManager";
import {
  selectActiveUser,
  type ActiveUser,
  useUserStore,
} from "../../store/user_store";
import "./profile.scss";

type UserRole = "owner" | "studio_user" | string;

type ProfileUser = {
  _id?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  created_at?: string;
  avatar?: {
    url?: string;
  };
  studio?: {
    name?: string;
    users?: unknown[];
  };
  schematics?: unknown[];
  collections?: unknown[];
  permissions?: {
    profile?: {
      studio_user_manager?: boolean;
      view_user_stats?: boolean;
    };
  };
};

type UserDataResponse = ProfileUser;

type StudioOwnerResponse = {
  ownerData?: ProfileUser;
};

type UpdateProfileResponse = {
  message?: string;
};

type ProfileFormState = {
  id: string;
  username: string;
  email: string;
  studio_name: string;
  old_password: string;
  new_password: string;
  repeat_new_password: string;
};

const EMPTY_FORM: ProfileFormState = {
  id: "",
  username: "",
  email: "",
  studio_name: "",
  old_password: "",
  new_password: "",
  repeat_new_password: "",
};

function asProfileUser(user: ActiveUser | null): ProfileUser {
  if (!user || typeof user !== "object") {
    return {};
  }

  return user as ProfileUser;
}

function formatJoinedDate(createdAt?: string): string {
  if (!createdAt) {
    return "Unknown";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "/");
}

function initialsFromName(name?: string): string {
  if (!name) {
    return "PR";
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "PR";
  }

  return trimmed.slice(0, 2).toUpperCase();
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function Profile() {
  const activeUserRaw = useUserStore(selectActiveUser);
  const setActiveUser = useUserStore((state) => state.setActiveUser);
  const activeUser = asProfileUser(activeUserRaw);

  const [formData, setFormData] = useState<ProfileFormState>(EMPTY_FORM);
  const [studioOwner, setStudioOwner] = useState<ProfileUser | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      try {
        const response = await customFetch<UserDataResponse>(
          "/get-user-data",
          "GET",
        );

        if (response.status !== 200) {
          popupMessage("There was an error fetching user data.", "error");
          return;
        }

        if (!isMounted) {
          return;
        }

        setActiveUser(response.data as ActiveUser);
      } catch (error) {
        console.error(error);
        popupMessage("Unexpected error fetching user data.", "error");
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [setActiveUser]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStudioOwner() {
      if (activeUser.role !== "studio_user") {
        setStudioOwner(null);
        return;
      }

      try {
        const response = await customFetch<StudioOwnerResponse>(
          "/get-studio-owner-data",
          "GET",
        );

        if (!isMounted) {
          return;
        }

        setStudioOwner(response.data.ownerData ?? null);
      } catch (error) {
        console.error(error);
        popupMessage("Could not fetch studio owner data.", "error");
      }
    }

    fetchStudioOwner();

    return () => {
      isMounted = false;
    };
  }, [activeUser.role]);

  useEffect(() => {
    setFormData({
      id: activeUser._id ?? "",
      username: activeUser.username ?? "",
      email: activeUser.email ?? "",
      studio_name: activeUser.studio?.name ?? "",
      old_password: "",
      new_password: "",
      repeat_new_password: "",
    });

    setAvatarPreviewUrl(activeUser.avatar?.url ?? "");
    setAvatarFile(null);
  }, [
    activeUser._id,
    activeUser.avatar?.url,
    activeUser.email,
    activeUser.studio?.name,
    activeUser.username,
  ]);

  const joinedAt = useMemo(
    () => formatJoinedDate(activeUser.created_at),
    [activeUser.created_at],
  );

  const isOwner = activeUser.role === "owner";
  const isStudioUser = activeUser.role === "studio_user";
  const canManageStudioUsers = Boolean(
    activeUser.permissions?.profile?.studio_user_manager,
  );
  const canViewStats = Boolean(
    activeUser.permissions?.profile?.view_user_stats,
  );

  const referenceUser = isStudioUser ? (studioOwner ?? null) : activeUser;

  const studioName = isOwner
    ? (activeUser.studio?.name ?? "N/A")
    : (studioOwner?.studio?.name ?? activeUser.studio?.name ?? "N/A");

  const schematicsCount = referenceUser?.schematics?.length ?? 0;
  const collectionsCount = referenceUser?.collections?.length ?? 0;
  const studioUsersCount = isStudioUser
    ? undefined
    : (activeUser.studio?.users?.length ?? 0);

  function updateFormField(field: keyof ProfileFormState, value: string): void {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleAvatarSelect(file: File | null) {
    if (!file) {
      return;
    }

    const validTypes = new Set(["image/png", "image/jpg", "image/jpeg"]);
    if (!validTypes.has(file.type)) {
      popupMessage("Please select a PNG or JPG image.", "error");
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function submitProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.username.trim()) {
      popupMessage("Please enter a valid username.", "error");
      return;
    }

    if (!isStudioUser && !formData.email.trim()) {
      popupMessage("Please enter a valid email.", "error");
      return;
    }

    if (!isStudioUser && !formData.studio_name.trim()) {
      popupMessage("Please enter a valid studio name.", "error");
      return;
    }

    if (formData.new_password.trim() || formData.repeat_new_password.trim()) {
      if (
        formData.new_password.trim() !== formData.repeat_new_password.trim()
      ) {
        popupMessage("New password and repeat password do not match.", "error");
        return;
      }
    }

    setIsSubmitting(true);
    popupMessage("Updating profile...", "info");

    try {
      const payload = new FormData();

      if (avatarFile) {
        const compressedAvatar = await compressImage(avatarFile);
        const avatarBase64 = await fileToBase64(compressedAvatar);
        payload.append("avatar", avatarBase64);
      }

      payload.append("id", formData.id);
      payload.append("username", formData.username);
      payload.append("email", formData.email);
      payload.append("old_password", formData.old_password);
      payload.append("studio_name", formData.studio_name);
      payload.append("new_password", formData.new_password);

      const response = await customFetch<UpdateProfileResponse>(
        "/update-profile",
        "POST",
        payload,
      );

      if (response.status === 200 || response.status === 201) {
        popupMessage("Profile updated successfully.", "success");

        const refreshed = await customFetch<UserDataResponse>(
          "/get-user-data",
          "GET",
        );
        if (refreshed.status === 200) {
          setActiveUser(refreshed.data as ActiveUser);
        }

        setFormData((previous) => ({
          ...previous,
          old_password: "",
          new_password: "",
          repeat_new_password: "",
        }));
        setAvatarFile(null);
        return;
      }

      if (response.status === 304) {
        popupMessage("No profile changes detected.", "info");
        return;
      }

      popupMessage(response.data.message ?? "Error updating profile.", "error");
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error while updating profile.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthenticatedPageBackground className="profile-page page-fade-in">
      <main className="profile-page__layout">
        <Card className="profile-page__card" radius="sm" p="lg">
          <Stack gap="lg">
            <div className="profile-page__heading-wrap">
              <Title order={2} className="profile-page__title">
                Profile
              </Title>
              <Text className="profile-page__subtitle">
                Manage account details, security, and studio information.
              </Text>
            </div>

            <div className="profile-page__profile-grid">
              <div className="profile-page__avatar-column">
                <Avatar
                  src={avatarPreviewUrl || null}
                  alt="Profile avatar"
                  radius="sm"
                  className="profile-page__avatar"
                >
                  {initialsFromName(activeUser.username)}
                </Avatar>

                <Text className="profile-page__avatar-hint" size="sm">
                  PNG, JPG, JPEG
                </Text>

                <FileButton
                  onChange={handleAvatarSelect}
                  accept="image/png,image/jpeg,image/jpg"
                >
                  {(fileButtonProps) => (
                    <Button
                      {...fileButtonProps}
                      className="ui-button-template ui-button-template--surface profile-page__avatar-upload"
                      radius="sm"
                    >
                      Update Avatar
                    </Button>
                  )}
                </FileButton>
              </div>

              <form
                className="profile-page__form"
                onSubmit={submitProfileUpdate}
                noValidate
              >
                <Stack gap="sm">
                  <TextInput
                    label="Username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(event) =>
                      updateFormField("username", event.currentTarget.value)
                    }
                    classNames={{
                      label: "profile-page__field-label",
                      input:
                        "profile-page__field-input ui-input-template ui-input-template--transparent",
                    }}
                  />

                  {isOwner && (
                    <>
                      <TextInput
                        label="Email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(event) =>
                          updateFormField("email", event.currentTarget.value)
                        }
                        classNames={{
                          label: "profile-page__field-label",
                          input:
                            "profile-page__field-input ui-input-template ui-input-template--transparent",
                        }}
                      />

                      <TextInput
                        label="Studio Name"
                        placeholder="Studio name"
                        value={formData.studio_name}
                        onChange={(event) =>
                          updateFormField(
                            "studio_name",
                            event.currentTarget.value,
                          )
                        }
                        classNames={{
                          label: "profile-page__field-label",
                          input:
                            "profile-page__field-input ui-input-template ui-input-template--transparent",
                        }}
                      />
                    </>
                  )}

                  <Divider
                    label="Change Password"
                    labelPosition="left"
                    className="profile-page__divider"
                  />

                  <PasswordInput
                    label="Old Password"
                    placeholder="Old password"
                    value={formData.old_password}
                    onChange={(event) =>
                      updateFormField("old_password", event.currentTarget.value)
                    }
                    classNames={{
                      label: "profile-page__field-label",
                      input:
                        "profile-page__field-input ui-input-template ui-input-template--transparent",
                    }}
                  />

                  <PasswordInput
                    label="New Password"
                    placeholder="New password"
                    value={formData.new_password}
                    onChange={(event) =>
                      updateFormField("new_password", event.currentTarget.value)
                    }
                    classNames={{
                      label: "profile-page__field-label",
                      input:
                        "profile-page__field-input ui-input-template ui-input-template--transparent",
                    }}
                  />

                  <PasswordInput
                    label="Repeat New Password"
                    placeholder="Repeat new password"
                    value={formData.repeat_new_password}
                    onChange={(event) =>
                      updateFormField(
                        "repeat_new_password",
                        event.currentTarget.value,
                      )
                    }
                    classNames={{
                      label: "profile-page__field-label",
                      input:
                        "profile-page__field-input ui-input-template ui-input-template--transparent",
                    }}
                  />

                  <Group justify="flex-end" pt="xs">
                    <Button
                      type="submit"
                      loading={isSubmitting}
                      radius="sm"
                      className="profile-page__submit"
                    >
                      Update Profile
                    </Button>
                  </Group>
                </Stack>
              </form>
            </div>
          </Stack>
        </Card>

        {canManageStudioUsers && (
          <Card className="profile-page__card" radius="sm" p="lg">
            <Stack gap="xs">
              <Title order={4} className="profile-page__section-title">
                {studioName} user manager
              </Title>
              <StudioUserManager />
            </Stack>
          </Card>
        )}

        {canViewStats && (
          <Card className="profile-page__card" radius="sm" p="lg">
            <Stack gap="md">
              <Title order={4} className="profile-page__section-title">
                User Statistics
              </Title>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <div className="profile-page__stat-row">
                  <Text className="profile-page__stat-label">Joined at</Text>
                  <Text className="profile-page__stat-value">{joinedAt}</Text>
                </div>

                <div className="profile-page__stat-row">
                  <Text className="profile-page__stat-label">Studio name</Text>
                  <Text className="profile-page__stat-value">{studioName}</Text>
                </div>

                <div className="profile-page__stat-row">
                  <Text className="profile-page__stat-label">Schematics</Text>
                  <Text className="profile-page__stat-value">
                    {schematicsCount}
                  </Text>
                </div>

                <div className="profile-page__stat-row">
                  <Text className="profile-page__stat-label">Collections</Text>
                  <Text className="profile-page__stat-value">
                    {collectionsCount}
                  </Text>
                </div>

                {typeof studioUsersCount === "number" && (
                  <div className="profile-page__stat-row">
                    <Text className="profile-page__stat-label">
                      Studio users
                    </Text>
                    <Text className="profile-page__stat-value">
                      {studioUsersCount}
                    </Text>
                  </div>
                )}
              </SimpleGrid>
            </Stack>
          </Card>
        )}
      </main>
    </AuthenticatedPageBackground>
  );
}

export default Profile;
