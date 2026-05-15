/**
 * Извлекает ID ролика YouTube из URL или из «голого» id (11 символов).
 * Видео хостится на YouTube; на платформе хранится только идентификатор для embed.
 */
export function parseYouTubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const paths = u.pathname.split("/").filter(Boolean);
      const embedIdx = paths.indexOf("embed");
      if (embedIdx >= 0 && paths[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(paths[embedIdx + 1])) {
        return paths[embedIdx + 1];
      }
      const shortsIdx = paths.indexOf("shorts");
      if (shortsIdx >= 0 && paths[shortsIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(paths[shortsIdx + 1])) {
        return paths[shortsIdx + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
}
