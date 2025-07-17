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
    <div className="space-y-4">
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
