export function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="tag-chips">
      {tags.map((tag, i) => (
        <span key={i} className="tag-chip">
          {tag}
        </span>
      ))}
    </div>
  );
}
