import { createContext, useContext, useRef, useState } from "react";

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentChild, setCurrentChild] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const modalOnCloseRef = useRef(null);

  const openModal = (child, title = "", onClose = null) => {
    setCurrentChild(child);
    setModalTitle(title);
    modalOnCloseRef.current = onClose;
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentChild(null);
    setModalTitle("");

    if (typeof modalOnCloseRef.current === "function") {
      const callback = modalOnCloseRef.current;
      modalOnCloseRef.current = null;
      callback();
    }
  };

  return (
    <AppContext.Provider
      value={{
        modalOpen,
        setModalOpen,
        currentChild,
        setCurrentChild,
        modalTitle,
        openModal,
        closeModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};