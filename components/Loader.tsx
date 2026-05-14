
import { TbLoader3 } from "react-icons/tb";

export const Loader = () => {
  return (
    <div className="flex items-center justify-center h-[100px]">
      <TbLoader3 className="animate-spin" size={32} />
    </div>
  );
};

// Full-page loading overlay
export const LoadingOverlay = ({ message = "Loading..." }: { message?: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <TbLoader3 className="animate-spin text-purple-600" size={48} />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);
