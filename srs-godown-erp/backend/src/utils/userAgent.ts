/**
 * Lightweight, dependency-free User-Agent parser.
 * Returns display-friendly browser / os / device labels for login history.
 */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(ua?: string): ParsedUserAgent {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  const browser =
    /edg/i.test(ua) ? 'Edge'
    : /opr|opera/i.test(ua) ? 'Opera'
    : /chrome|crios/i.test(ua) ? 'Chrome'
    : /firefox|fxios/i.test(ua) ? 'Firefox'
    : /safari/i.test(ua) ? 'Safari'
    : 'Unknown';

  const os =
    /windows/i.test(ua) ? 'Windows'
    : /android/i.test(ua) ? 'Android'
    : /iphone|ipad|ipod/i.test(ua) ? 'iOS'
    : /mac os/i.test(ua) ? 'macOS'
    : /linux/i.test(ua) ? 'Linux'
    : 'Unknown';

  const device =
    /mobile|iphone|ipod|android.*mobile/i.test(ua) ? 'Mobile'
    : /ipad|tablet|android/i.test(ua) ? 'Tablet'
    : 'Desktop';

  return { browser, os, device };
}
