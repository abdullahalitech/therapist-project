import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
}

export function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    document.title = `${title} | TherapyConnect`;
    const meta = document.querySelector('meta[name="description"]');
    if (description) {
      if (meta) meta.setAttribute("content", description);
      else {
        const el = document.createElement("meta");
        el.name = "description";
        el.content = description;
        document.head.appendChild(el);
      }
    }
  }, [title, description]);

  return null;
}
