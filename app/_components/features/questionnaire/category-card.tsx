import React from "react";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  description,
  icon,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative w-full text-left flex items-center gap-4 px-6 py-7 border rounded-xl transition-all duration-200
        bg-white
        ${
          selected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow"
        }
        focus:outline-none focus:ring-2 focus:ring-blue-200
      `}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 text-lg mb-1">{name}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      {selected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </button>
  );
};

export default CategoryCard;
