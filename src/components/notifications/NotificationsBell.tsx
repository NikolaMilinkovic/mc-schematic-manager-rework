import { ActionIcon, Indicator } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import "./notifications.scss";

type NotificationsBellProps = {
  count?: number;
};

function NotificationsBell({ count = 0 }: NotificationsBellProps) {
  const bell = (
    <ActionIcon
      variant="subtle"
      radius="xl"
      size={38}
      className="notifications-bell"
    >
      <IconBell size={18} />
    </ActionIcon>
  );

  if (count <= 0) {
    return bell;
  }

  return (
    <Indicator
      inline
      label={count > 9 ? "9+" : `${count}`}
      size={18}
      radius="xl"
      color="darkgreen"
      className="notifications-bell__indicator"
    >
      {bell}
    </Indicator>
  );
}

export default NotificationsBell;
