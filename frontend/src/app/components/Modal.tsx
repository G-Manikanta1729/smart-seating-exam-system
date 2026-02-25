import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  /* Prevent background scroll + ESC close */
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose} //  click outside
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform animate-slideUp"
        onClick={(e) => e.stopPropagation()} //  prevent close on modal click
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-[#718096] hover:text-[#667eea] transition-colors p-2 hover:bg-[#F7FAFC] rounded-xl"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
