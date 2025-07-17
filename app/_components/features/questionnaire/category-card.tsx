import React from "react";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  onClick: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  description,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative w-full text-left px-6 py-6 border rounded-xl transition-all duration-200
        bg-white
        ${
          selected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow"
        }
        focus:outline-none focus:ring-2 focus:ring-blue-200
      `}
    >
      <div className="flex items-center space-x-4">
        <div className="text-3xl text-gray-600">
          {/* アイコンは後で追加可能 */}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 text-xl mb-1">{name}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
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
