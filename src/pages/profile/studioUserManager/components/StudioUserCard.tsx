import { useState } from "react";
import { Button, Card, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconChevronDown, IconTrash } from "@tabler/icons-react";
import ActionConfirmModal from "../../../../components/actionConfirmModal/ActionConfirmModal";
import StudioUserPermissions from "./StudioUserPermissions";
import type { PermissionCategory, StudioManagedUser } from "./types";
import "./studio-user-card.scss";

type StudioUserCardProps = {
  user: StudioManagedUser;
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

function StudioUserCard({
  user,
  removingCustomId,
  onFieldChange,
  onRemoveUser,
  onPermissionChange,
}: StudioUserCardProps) {
  const [opened, setOpened] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggleCard() {
    setOpened((previous) => !previous);
  }

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    if (opened) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-stop-toggle='true']")) {
      return;
    }

    toggleCard();
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (opened) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  }

  function handleHeaderClick(event: React.MouseEvent<HTMLElement>) {
    if (!opened) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-stop-toggle='true']")) {
      return;
    }

    toggleCard();
  }

  function handleHeaderKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!opened) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  }

  async function handleConfirmRemove() {
    await onRemoveUser(user.custom_id);
    setConfirmOpen(false);
  }

  function handleCancelRemove() {
    setConfirmOpen(false);
  }

  return (
    <>
      <ActionConfirmModal
        opened={confirmOpen}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Remove Studio User"
        description="This will remove the user from your studio access list. This action cannot be undone."
        confirmLabel="Remove"
        isLoading={removingCustomId === user.custom_id}
      />

      <Card
        className={`studio-user-card ${opened ? "" : "studio-user-card--collapsed"}`}
        radius="sm"
        p="md"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role={opened ? undefined : "button"}
        tabIndex={opened ? -1 : 0}
        aria-expanded={opened}
      >
        <Group
          justify="space-between"
          align="center"
          gap="sm"
          className={`studio-user-card__header ${opened ? "studio-user-card__header--clickable" : ""}`}
          onClick={handleHeaderClick}
          onKeyDown={handleHeaderKeyDown}
          role={opened ? "button" : undefined}
          tabIndex={opened ? 0 : -1}
          aria-expanded={opened}
        >
          <div className="studio-user-card__toggle">
            <IconChevronDown
              size={16}
              className="studio-user-card__toggle-icon"
              data-opened={opened}
            />
            <Text className="studio-user-card__toggle-text">
              {user.username}
            </Text>
          </div>

          <Button
            type="button"
            radius="xs"
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconTrash size={14} />}
            loading={removingCustomId === user.custom_id}
            onClick={(event) => {
              event.stopPropagation();
              setConfirmOpen(true);
            }}
            className="studio-user-card__remove"
            data-stop-toggle="true"
          >
            Delete
          </Button>
        </Group>

        {opened && (
          <Stack gap="sm" className="studio-user-card__content">
            <Group grow>
              <TextInput
                label="Username"
                placeholder="Studio username"
                value={user.username}
                onChange={(event) =>
                  onFieldChange(
                    user.custom_id,
                    "username",
                    event.currentTarget.value,
                  )
                }
                radius="xs"
                classNames={{
                  label: "studio-user-card__field-label",
                  input:
                    "studio-user-card__field-input ui-input-template ui-input-template--transparent",
                }}
              />

              <TextInput
                label="Password"
                placeholder="Set a temporary password"
                value={user.password}
                onChange={(event) =>
                  onFieldChange(
                    user.custom_id,
                    "password",
                    event.currentTarget.value,
                  )
                }
                radius="xs"
                classNames={{
                  label: "studio-user-card__field-label",
                  input:
                    "studio-user-card__field-input ui-input-template ui-input-template--transparent",
                }}
              />
            </Group>

            <StudioUserPermissions
              user={user}
              onPermissionChange={onPermissionChange}
            />
          </Stack>
        )}
      </Card>
    </>
  );
}

export default StudioUserCard;
