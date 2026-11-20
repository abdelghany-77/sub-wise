import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  variant = "danger",
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" compact>
      <p className="text-white/60 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex-1 min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          variant={variant}
          className="flex-1 min-h-[44px]"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
