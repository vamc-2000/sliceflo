export function formatDiscussionDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Today, ${time}`;
  }

  if (isYesterday) {
    return `Yesterday, ${time}`;
  }

  const formattedDate = date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${formattedDate}, ${time}`;
}


export function formatRelativeDate(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;

  const isYesterday =
    diffDays === 1 &&
    now.toDateString() !== date.toDateString();

  if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) +
    " · " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
}
