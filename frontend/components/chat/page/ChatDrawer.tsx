import { useEffect, useId, useRef, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import styles from "./ChatPage.module.css";

export default function ChatDrawer({
  open,
  onClose,
  title,
  side,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side: "left" | "right";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    headingId = useId(),
    controls = useDragControls();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      data-side={side}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        className={styles.drawerContent}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 500) onClose();
        }}
      >
        <div
          className={styles.sheetHandle}
          onPointerDown={(event) => controls.start(event)}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className={styles.drawerHeading}>
          <h2 id={headingId}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Đóng ${title.toLowerCase()}`}
          >
            <X size={19} />
          </button>
        </div>
        <div className={styles.drawerBody} data-lenis-prevent>
          {children}
        </div>
      </motion.div>
    </dialog>
  );
}
