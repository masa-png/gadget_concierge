import React from "react";
import CategoryCard from "./category-card";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          id={category.id}
          name={category.name}
          description={category.description}
          selected={selectedCategory === category.id}
          onClick={onCategorySelect}
        />
      ))}
    </div>
  );
};

export default CategoryList;
