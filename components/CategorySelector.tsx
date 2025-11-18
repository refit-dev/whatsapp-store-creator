"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategorySelectorProps {
  selectedCategories: string[]; // Array of category IDs
  onCategoryChange: (categoryIds: string[]) => void;
  maxSelection?: number;
  showSubcategories?: boolean;
  mode?: "onboarding" | "settings";
}

export default function CategorySelector({
  selectedCategories,
  onCategoryChange,
  maxSelection = 3,
  showSubcategories = false,
  mode = "onboarding",
}: CategorySelectorProps) {
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedPrimary && showSubcategories) {
      fetchSubCategories(selectedPrimary);
    }
  }, [selectedPrimary, showSubcategories]);

  const fetchCategories = async () => {
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("level", 1)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPrimaryCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCategories = async (parentId: string) => {
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);

    if (isSelected) {
      // Remove category
      const updated = selectedCategories.filter((id) => id !== categoryId);
      onCategoryChange(updated);
    } else {
      // Add category (check max limit)
      if (selectedCategories.length < maxSelection) {
        onCategoryChange([...selectedCategories, categoryId]);
      }
    }

    // If primary category clicked, show subcategories
    const category = primaryCategories.find((c) => c.id === categoryId);
    if (category && category.level === 1) {
      setSelectedPrimary(categoryId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "onboarding" && (
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Choose Your Store Category
          </h2>
          <p className="text-gray-600">
            Select up to {maxSelection} categories that best describe your
            business
          </p>
          <p className="text-sm text-gray-500">
            You can change this later in settings
          </p>
        </div>
      )}

      {/* Selection Counter */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-900">
          Selected: {selectedCategories.length} of {maxSelection}
        </span>
        {selectedCategories.length > 0 && (
          <button
            onClick={() => onCategoryChange([])}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Primary Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {primaryCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const isDisabled =
            !isSelected && selectedCategories.length >= maxSelection;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              disabled={isDisabled}
              className={`
                relative p-6 rounded-xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                }
                ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
                flex flex-col items-center gap-3
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}

              {/* Category Icon */}
              <div className="text-4xl">{category.icon || "📦"}</div>

              {/* Category Name */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subcategories (if enabled and primary selected) */}
      {showSubcategories && selectedPrimary && subCategories.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Specific Sub-Categories (Optional)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {subCategories.map((subCategory) => {
                const isSelected = selectedCategories.includes(subCategory.id);
                const isDisabled =
                  !isSelected && selectedCategories.length >= maxSelection;

                return (
                  <button
                    key={subCategory.id}
                    onClick={() => handleCategoryClick(subCategory.id)}
                    disabled={isDisabled}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }
                      ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{subCategory.icon || "•"}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {subCategory.name}
                      </span>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-blue-600 ml-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Skip Option for Onboarding */}
      {mode === "onboarding" && selectedCategories.length === 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Not sure? You can skip this step and add categories later from your
            dashboard
          </p>
        </div>
      )}
    </div>
  );
}
