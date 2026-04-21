import { toast } from "react-toastify";

type ToastType = "success" | "error" | "info" | "warning";

const DEFAULT_OPTIONS = {
  position: "top-right" as const,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const popupMessage = (message: string, type: ToastType) => {
  return toast[type](message, DEFAULT_OPTIONS);
};
