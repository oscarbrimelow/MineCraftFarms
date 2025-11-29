/**
 * URL sanitization utilities to prevent XSS and open redirect attacks
 */

/**
 * Validates and sanitizes a URL to prevent XSS and open redirects
 * @param url - The URL to validate
 * @param allowedProtocols - Array of allowed protocols (default: ['http:', 'https:'])
 * @param allowedDomains - Optional array of allowed domains (if provided, only these domains are allowed)
 * @returns The sanitized URL or null if invalid
 */
export function sanitizeUrl(
  url: string | null | undefined,
  allowedProtocols: string[] = ['http:', 'https:'],
  allowedDomains?: string[]
): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    // Remove any whitespace
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    // Parse the URL
    const parsedUrl = new URL(trimmedUrl);

    // Check protocol
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return null;
    }

    // Check domain if whitelist provided
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(
        (domain) => hostname === domain.toLowerCase() || hostname.endsWith('.' + domain.toLowerCase())
      );
      if (!isAllowed) {
        return null;
      }
    }

    // Return the sanitized URL
    return parsedUrl.toString();
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Validates a YouTube URL and converts it to an embed URL
 * @param url - The YouTube URL to validate
 * @returns The embed URL or null if invalid
 */
export function sanitizeYouTubeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    // Extract video ID from various YouTube URL formats
    let videoId: string | null = null;

    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmedUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }

    // youtube.com/embed/VIDEO_ID
    const embedMatch = trimmedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }

    // youtu.be/VIDEO_ID
    const shortMatch = trimmedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    // youtube.com/v/VIDEO_ID
    const vMatch = trimmedUrl.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
    if (vMatch) {
      videoId = vMatch[1];
    }

    if (!videoId) return null;

    // Validate video ID format (11 characters, alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    // Return safe embed URL
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

/**
 * Validates an image URL
 * @param url - The image URL to validate
 * @returns The sanitized URL or null if invalid
 */
export function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  // Allow data URLs for images (base64 encoded)
  if (url.startsWith('data:image/')) {
    // Validate data URL format
    if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/.test(url)) {
      return url;
    }
    return null;
  }

  // Sanitize regular HTTP/HTTPS URLs
  return sanitizeUrl(url, ['http:', 'https:']);
}

/**
 * Validates a YouTube channel URL
 * @param channelId - The channel ID or URL
 * @returns A safe YouTube channel URL or null if invalid
 */
export function sanitizeYouTubeChannelUrl(channelId: string | null | undefined): string | null {
  if (!channelId || typeof channelId !== 'string') return null;

  const trimmed = channelId.trim();
  if (!trimmed) return null;

  // If it's already a full URL, validate it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const sanitized = sanitizeUrl(trimmed, ['http:', 'https:'], ['youtube.com', 'www.youtube.com']);
    if (sanitized) return sanitized;
    return null;
  }

  // If it's just a channel ID or path, construct a safe URL
  // Only allow alphanumeric, dashes, underscores, and forward slashes
  if (/^[a-zA-Z0-9_/-]+$/.test(trimmed)) {
    return `https://www.youtube.com/${trimmed}`;
  }

  return null;
}

/**
 * Escapes HTML to prevent XSS
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

