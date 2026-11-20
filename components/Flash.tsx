export function Flash({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mb-4 p-3 border border-gray-500 bg-gray-100 text-black"
      data-testid="flash-message"
      role="status"
    >
      {message}
    </p>
  );
}