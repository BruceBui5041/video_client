"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HLSPlayer from "../components/HSLPlayer";
import Link from "next/link";
import { Course, getCourses } from "@/clientapi/course-get";

const CoursesPage = () => {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const result = await getCourses();
      if (result.success) {
        setCourses(result.courses || []);
      } else {
        setError(result.message || null);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div>Loading courses...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="border rounded-lg p-4 shadow-md">
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-2">{course.description}</p>
            <Link
              href={`/course/${course.slug}`}
              className="text-blue-500 hover:underline"
            >
              View Course
            </Link>
          </div>
        ))}
      </div>

      {name && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">HLS Video Player</h2>
          <HLSPlayer videoName={name} />
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
