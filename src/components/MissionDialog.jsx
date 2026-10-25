import { useEffect, useRef } from "react";
export default function MissionDialog({ children, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    (
      dialog.querySelector("[data-dialog-cancel]") ||
      dialog.querySelector("[data-dialog-initial]")
    )?.focus();
    if (dialog.querySelector("[data-dialog-initial]")) dialog.scrollTop = 0;
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="mission-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel?.();
      }}
      aria-labelledby="result-title"
    >
      <section className="end-card">{children}</section>
    </dialog>
  );
}
