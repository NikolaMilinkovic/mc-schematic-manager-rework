import {
  Box,
  Button,
  Group,
  ScrollArea,
  Text,
  UnstyledButton,
} from "@mantine/core";
import "./notifications.scss";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  read: boolean;
};

type NotificationsDropdownProps = {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onOpenNotification: (notification: NotificationItem) => void;
};

export function NotificationsDropdown({
  notifications,
  onMarkAllRead,
  onOpenNotification,
}: NotificationsDropdownProps) {
  return (
    <Box className="notifications-dropdown">
      <Group
        justify="space-between"
        px="sm"
        py="sm"
        className="notifications-dropdown__header"
      >
        <Text fw={600}>Notifications</Text>
        <Button
          variant="subtle"
          size="xs"
          onClick={onMarkAllRead}
          className="notifications-dropdown__mark-all"
        >
          Mark all as read
        </Button>
      </Group>

      <ScrollArea.Autosize mah={320}>
        {notifications.length === 0 ? (
          <Text c="dimmed" size="sm" px="sm" py="md">
            No new notifications
          </Text>
        ) : (
          notifications.map((notification) => (
            <UnstyledButton
              key={notification.id}
              onClick={() => onOpenNotification(notification)}
              className={`notifications-dropdown__item${notification.read ? "" : " notifications-dropdown__item--unread"}`}
            >
              <Text size="sm" fw={notification.read ? 400 : 600}>
                {notification.title}
              </Text>
              {notification.description && (
                <Text
                  size="xs"
                  mt={4}
                  className="notifications-dropdown__description"
                >
                  {notification.description}
                </Text>
              )}
            </UnstyledButton>
          ))
        )}
      </ScrollArea.Autosize>

      <Box px="sm" py="sm" className="notifications-dropdown__footer">
        <Button
          variant="light"
          fullWidth
          size="sm"
          className="notifications-dropdown__view-all"
        >
          View all
        </Button>
      </Box>
    </Box>
  );
}
