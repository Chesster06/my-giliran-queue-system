// Helper to resolve the correct phone-accessible URL on the local Wi-Fi network

let cachedLanIp = localStorage.getItem('mygiliran_lan_ip') || '192.168.0.5';

// Pre-fetch LAN IP from backend API
if (typeof window !== 'undefined') {
  fetch('/api/network-info')
    .then((res) => res.json())
    .then((data) => {
      if (data?.lanIp) {
        cachedLanIp = data.lanIp;
        localStorage.setItem('mygiliran_lan_ip', data.lanIp);
      }
    })
    .catch(() => {});
}

export function getCustomerAccessUrl(slug, options = {}) {
  if (typeof window === 'undefined') {
    return `http://192.168.0.5:3000/?page=customer&slug=${slug}`;
  }

  // If already on a real LAN IP or production domain (not localhost)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/?page=customer&slug=${slug}`;
  }

  // If on localhost on PC, return Wi-Fi IP so the phone can access!
  const lanIp = localStorage.getItem('mygiliran_lan_ip') || cachedLanIp || '192.168.0.5';
  const port = window.location.port || '3000';
  return `http://${lanIp}:${port}/?page=customer&slug=${slug}`;
}
