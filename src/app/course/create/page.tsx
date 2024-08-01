"use client";

import React, { useState, useEffect } from "react";
import { generateSlugs } from "../../../utils";
import { createCourse } from "@/clientapi/course-create";
import { getCategories } from "@/clientapi/category-get";
import { withAuth } from "@/app/components/withAuth";

interface Category {
  id: number;
  name: string;
}

const CreateCourseForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [slugOptions, setSlugOptions] = useState<string[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const { success, categories } = await getCategories();
      setIsLoading(false);
      if (success && Array.isArray(categories)) {
        setCategories(categories);
      } else {
        setError("Failed to load categories");
        setCategories([]); // Ensure categories is always an array
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (title) {
      const newSlugs = generateSlugs(title);
      setSlugOptions(newSlugs);
      setSelectedSlug(newSlugs[0]);
    }
  }, [title]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError("Please select a category");
      setIsSubmitting(false);
      return;
    }

    const result = await createCourse({
      title,
      description,
      category_id: categoryId,
      slug: selectedSlug,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess("Course created successfully!");
      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setSelectedSlug("");
    } else {
      setError(result.message || "Failed to create course");
    }
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a New Course
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Course Title
              </label>
              <div className="mt-1">
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Course Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                Course Slug
              </label>
              <div className="mt-1">
                <select
                  id="slug"
                  name="slug"
                  required
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {slugOptions.map((slug) => (
                    <option key={slug} value={slug}>
                      {slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            {success && <div className="text-green-600 text-sm">{success}</div>}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default withAuth(CreateCourseForm);
