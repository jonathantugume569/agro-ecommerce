import { useEffect } from "react";
import { XIcon } from "@phosphor-icons/react";
import { useAppContext } from "../../context/AppContext";

function AppModal({ children }) {
  const { modalOpen, closeModal, currentChild, modalTitle } = useAppContext();

  useEffect(() => {
    if (!modalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [modalOpen]);

  return (
    modalOpen && (
      <section
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          e.preventDefault();
          closeModal();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/27 bg-opacity-50 overscroll-contain"
      >
        <div
          className="bg-white p-4 m-4 w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold mb-4">{modalTitle}</h2>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <XIcon size={24} />
            </button>
          </div>
          {currentChild || children}
        </div>
      </section>
    )
  );
}

export default AppModal;