import { customAlphabet } from "nanoid";

export function generateSlugs(input: string, count: number = 8): string[] {
  // Function to create a slug from the input string
  function createSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove non-word chars
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  // Create the base slug
  const baseSlug = createSlug(input);

  // Generate unique slugs
  const slugs: string[] = [baseSlug];

  // Use nanoid to generate random strings
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

  while (slugs.length < count) {
    let newSlug: string;

    if (slugs.length === 1) {
      // For the second slug, try appending a number
      newSlug = `${baseSlug}-2`;
    } else {
      // For subsequent slugs, append a random string
      newSlug = `${baseSlug}-${nanoid()}`;
    }

    // Trim the slug if it's too long (optional, adjust as needed)
    if (newSlug.length > 50) {
      newSlug = newSlug.slice(0, 50).replace(/-+$/, "");
    }

    // Add the new slug if it's unique
    if (!slugs.includes(newSlug)) {
      slugs.push(newSlug);
    }
  }

  return slugs;
}

// Example usage with the given input
// const inputString = "Chandler & Ross being ICONIC best friends-(1080p).mp4";
// const suggestedSlugs = generateSlugs(inputString);
// console.log(suggestedSlugs);
