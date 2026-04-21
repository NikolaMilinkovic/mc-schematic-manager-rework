import { startTransition, useState } from "react";
import { ActionIcon, Burger, Button, Drawer, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUser } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user_store";
import NotificationsBell from "../notifications/NotificationsBell";
import {
  NotificationsDropdown,
  type NotificationItem,
} from "../notifications/NotificationsDropdown";
import "./navbar.scss";

type NavItem = {
  label: string;
  to: string;
};

type NavbarProps = {
  items?: NavItem[];
  onLogout?: () => void;
};

const defaultItems: NavItem[] = [
  { label: "Browse Schematics", to: "/" },
  { label: "Collections", to: "/collections" },
  { label: "Upload", to: "/upload-schematic" },
];

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Collection updated",
    description: "Your Redstone collection was updated.",
    read: false,
  },
  {
    id: "2",
    title: "Upload complete",
    description: "Castle schematic has finished processing.",
    read: false,
  },
  {
    id: "3",
    title: "Backup reminder",
    description: "Weekly export is ready to download.",
    read: true,
  },
];

function Navbar({ items = defaultItems, onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const clearActiveUser = useUserStore((state) => state.clearActiveUser);
  const [opened, { open, close }] = useDisclosure(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  function isActive(path: string): boolean {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  }

  function handleNavigate(path: string) {
    close();
    startTransition(() => {
      navigate(path);
    });
  }

  function handleMarkAllRead() {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
  }

  function handleOpenNotification(notification: NotificationItem) {
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );
  }

  function handleLogout() {
    if (onLogout) {
      onLogout();
      close();
      return;
    }

    clearActiveUser();
    close();
    navigate("/login", { replace: true });
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <header className="navbar-modern">
      <div className="navbar-modern__bar">
        <nav className="navbar-modern__nav" aria-label="Main navigation">
          {items.map((item) => {
            const active = isActive(item.to);
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => handleNavigate(item.to)}
                className={`navbar-modern__nav-button${active ? " navbar-modern__nav-button--active" : ""}`}
              >
                <span className="navbar-modern__nav-text">{item.label}</span>
                <span className="navbar-modern__nav-underline" />
              </button>
            );
          })}
        </nav>

        <div className="navbar-modern__actions">
          <div className="navbar-modern__notifications">
            <Menu
              shadow="md"
              width={320}
              position="bottom-end"
              classNames={{
                dropdown: "navbar-modern__menu-dropdown",
              }}
            >
              <Menu.Target>
                <button
                  type="button"
                  className="navbar-modern__icon-trigger"
                  aria-label="Notifications"
                >
                  <NotificationsBell count={unreadCount} />
                </button>
              </Menu.Target>

              <Menu.Dropdown p={0}>
                <NotificationsDropdown
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllRead}
                  onOpenNotification={handleOpenNotification}
                />
              </Menu.Dropdown>
            </Menu>
          </div>

          <div className="navbar-modern__profile-menu">
            <Menu
              shadow="md"
              width={190}
              position="bottom-end"
              classNames={{
                dropdown: "navbar-modern__menu-dropdown",
                item: "navbar-modern__profile-item",
              }}
            >
              <Menu.Target>
                <button
                  type="button"
                  className="navbar-modern__icon-trigger"
                  aria-label="User menu"
                >
                  <ActionIcon
                    variant="subtle"
                    radius="xl"
                    size={38}
                    className="navbar-modern__profile-trigger"
                  >
                    <IconUser size={18} />
                  </ActionIcon>
                </button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item onClick={() => handleNavigate("/profile/me")}>
                  Profile
                </Menu.Item>
                <Menu.Item onClick={handleLogout} c="red">
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>

          <Burger
            opened={opened}
            onClick={open}
            className="navbar-modern__burger"
            aria-label="Open menu"
          />
        </div>
      </div>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        withCloseButton={false}
        classNames={{
          content: "navbar-modern__drawer",
          body: "navbar-modern__drawer-body-wrap",
        }}
      >
        <div className="navbar-modern__drawer-body">
          <nav
            className="navbar-modern__drawer-nav"
            aria-label="Mobile navigation"
          >
            {items.map((item) => (
              <button
                key={`mobile-${item.to}`}
                type="button"
                onClick={() => handleNavigate(item.to)}
                className={`navbar-modern__drawer-link${isActive(item.to) ? " navbar-modern__drawer-link--active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <Button
            className="navbar-modern__drawer-link"
            variant="subtle"
            onClick={() => handleNavigate("/profile/me")}
          >
            Profile
          </Button>
          <Button
            className="navbar-modern__drawer-logout"
            variant="subtle"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Drawer>
    </header>
  );
}

export default Navbar;
