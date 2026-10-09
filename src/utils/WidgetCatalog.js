// Canonical upstream widget types; aliases remain accepted by the renderer.
export const WIDGET_COMPONENTS = {
  'adguard-dns-info': 'AdGuardDnsInfo',
  'adguard-filter-status': 'AdGuardFilterStatus',
  'adguard-stats': 'AdGuardStats',
  'adguard-top-domains': 'AdGuardTopDomains',
  addy: 'AnonAddy',
  anonaddy: 'AnonAddy',
  apod: 'Apod',
  'blacklist-check': 'BlacklistCheck',
  calendar: 'Calendar',
  chucknorris: 'ChuckNorris',
  clock: 'Clock',
  'code-stats': 'CodeStats',
  'covid-stats': 'CovidStats',
  'crypto-price-chart': 'CryptoPriceChart',
  'crypto-watch-list': 'CryptoWatchList',
  'custom-search': 'CustomSearch',
  'custom-list': 'CustomList',
  customapi: 'CustomApi',
  'custom-api': 'CustomApi',
  'cve-vulnerabilities': 'CveVulnerabilities',
  'domain-monitor': 'DomainMonitor',
  'drone-ci': 'DroneCi',
  embed: 'EmbedWidget',
  'eth-gas-prices': 'EthGasPrices',
  'exchange-rates': 'ExchangeRates',
  filebrowser: 'Filebrowser',
  'flight-data': 'Flights',
  'github-profile-stats': 'GitHubProfile',
  'github-trending-repos': 'GitHubTrending',
  'gl-alerts': 'GlAlerts',
  'gl-current-cores': 'GlCpuCores',
  'gl-current-cpu': 'GlCpuGauge',
  'gl-cpu-speedometer': 'GlCpuSpeedometer',
  'gl-cpu-history': 'GlCpuHistory',
  'gl-disk-io': 'GlDiskIo',
  'gl-disk-space': 'GlDiskSpace',
  'gl-ip-address': 'GlIpAddress',
  'gl-load-history': 'GlLoadHistory',
  'gl-current-mem': 'GlMemGauge',
  'gl-mem-speedometer': 'GlMemSpeedometer',
  'gl-mem-history': 'GlMemHistory',
  'gl-network-interfaces': 'GlNetworkInterfaces',
  'gl-network-traffic': 'GlNetworkTraffic',
  'gl-system-load': 'GlSystemLoad',
  'gl-uptime': 'GlancesUptime',
  'gl-cpu-temp': 'GlCpuTemp',
  'gl-gpu': 'GlGpu',
  'gluetun-status': 'GluetunStatus',
  'health-checks': 'HealthChecks',
  'hackernews-trending': 'HackernewsTrending',
  iframe: 'IframeWidget',
  image: 'ImageWidget',
  joke: 'Jokes',
  linkding: 'Linkding',
  'live-tennis': 'LiveTennis',
  'minecraft-status': 'MinecraftStatus',
  'mullvad-status': 'MullvadStatus',
  mvg: 'Mvg',
  'mvg-connection': 'MvgConnection',
  'nd-cpu-history': 'NdCpuHistory',
  'nd-load-history': 'NdLoadHistory',
  'nd-ram-history': 'NdRamHistory',
  'news-headlines': 'NewsHeadlines',
  'nextcloud-notifications': 'NextcloudNotifications',
  'nextcloud-php-opcache': 'NextcloudPhpOpcache',
  'nextcloud-stats': 'NextcloudStats',
  'nextcloud-system': 'NextcloudSystem',
  'nextcloud-user': 'NextcloudUser',
  'nextcloud-user-status': 'NextcloudUserStatus',
  'ntfy-stream': 'NtfyStream',
  'pi-hole-stats': 'PiHoleStats',
  'pi-hole-stats-v6': 'PiHoleStatsV6',
  'pi-hole-top-queries': 'PiHoleTopQueries',
  'pi-hole-top-queries-v6': 'PiHoleTopQueriesV6',
  'pi-hole-traffic': 'PiHoleTraffic',
  'pi-hole-traffic-v6': 'PiHoleTrafficV6',
  'proxmox-lists': 'Proxmox',
  'public-holidays': 'PublicHolidays',
  'public-ip': 'PublicIp',
  'rescue-time': 'RescueTime',
  'rss-feed': 'RssFeed',
  sabnzbd: 'Sabnzbd',
  'sports-scores': 'SportsScores',
  'stat-ping': 'StatPing',
  'stock-price-chart': 'StockPriceChart',
  'synology-download': 'SynologyDownload',
  'system-info': 'SystemInfo',
  'tfl-status': 'TflStatus',
  trmm: 'TacticalRMM',
  'uptime-kuma': 'UptimeKuma',
  'uptime-kuma-status-page': 'UptimeKumaStatusPage',
  'wallet-balance': 'WalletBalance',
  weather: 'Weather',
  'weather-forecast': 'WeatherForecast',
  'xkcd-comic': 'XkcdComic',
  'gl-compact-metrics': 'GlCompactMetrics',
};
export const WIDGET_CATALOG = [
  {
    "type": "adguard-dns-info",
    "component": "AdGuardDnsInfo",
    "label": "Ad Guard Dns Info"
  },
  {
    "type": "adguard-filter-status",
    "component": "AdGuardFilterStatus",
    "label": "Ad Guard Filter Status"
  },
  {
    "type": "adguard-stats",
    "component": "AdGuardStats",
    "label": "Ad Guard Stats"
  },
  {
    "type": "adguard-top-domains",
    "component": "AdGuardTopDomains",
    "label": "Ad Guard Top Domains"
  },
  {
    "type": "addy",
    "component": "AnonAddy",
    "label": "Anon Addy"
  },
  {
    "type": "apod",
    "component": "Apod",
    "label": "Apod"
  },
  {
    "type": "blacklist-check",
    "component": "BlacklistCheck",
    "label": "Blacklist Check"
  },
  {
    "type": "calendar",
    "component": "Calendar",
    "label": "Calendar"
  },
  {
    "type": "chucknorris",
    "component": "ChuckNorris",
    "label": "Chuck Norris"
  },
  {
    "type": "clock",
    "component": "Clock",
    "label": "Clock"
  },
  {
    "type": "code-stats",
    "component": "CodeStats",
    "label": "Code Stats"
  },
  {
    "type": "covid-stats",
    "component": "CovidStats",
    "label": "Covid Stats"
  },
  {
    "type": "crypto-price-chart",
    "component": "CryptoPriceChart",
    "label": "Crypto Price Chart"
  },
  {
    "type": "crypto-watch-list",
    "component": "CryptoWatchList",
    "label": "Crypto Watch List"
  },
  {
    "type": "custom-search",
    "component": "CustomSearch",
    "label": "Custom Search"
  },
  {
    "type": "custom-list",
    "component": "CustomList",
    "label": "Custom List"
  },
  {
    "type": "custom-api",
    "component": "CustomApi",
    "label": "Custom Api"
  },
  {
    "type": "cve-vulnerabilities",
    "component": "CveVulnerabilities",
    "label": "Cve Vulnerabilities"
  },
  {
    "type": "domain-monitor",
    "component": "DomainMonitor",
    "label": "Domain Monitor"
  },
  {
    "type": "drone-ci",
    "component": "DroneCi",
    "label": "Drone Ci"
  },
  {
    "type": "embed",
    "component": "EmbedWidget",
    "label": "Embed Widget"
  },
  {
    "type": "eth-gas-prices",
    "component": "EthGasPrices",
    "label": "Eth Gas Prices"
  },
  {
    "type": "exchange-rates",
    "component": "ExchangeRates",
    "label": "Exchange Rates"
  },
  {
    "type": "filebrowser",
    "component": "Filebrowser",
    "label": "Filebrowser"
  },
  {
    "type": "flight-data",
    "component": "Flights",
    "label": "Flights"
  },
  {
    "type": "github-profile-stats",
    "component": "GitHubProfile",
    "label": "Git Hub Profile"
  },
  {
    "type": "github-trending-repos",
    "component": "GitHubTrending",
    "label": "Git Hub Trending"
  },
  {
    "type": "gl-alerts",
    "component": "GlAlerts",
    "label": "Gl Alerts"
  },
  {
    "type": "gl-current-cores",
    "component": "GlCpuCores",
    "label": "Gl Cpu Cores"
  },
  {
    "type": "gl-current-cpu",
    "component": "GlCpuGauge",
    "label": "Gl Cpu Gauge"
  },
  {
    "type": "gl-cpu-speedometer",
    "component": "GlCpuSpeedometer",
    "label": "Gl Cpu Speedometer"
  },
  {
    "type": "gl-cpu-history",
    "component": "GlCpuHistory",
    "label": "Gl Cpu History"
  },
  {
    "type": "gl-disk-io",
    "component": "GlDiskIo",
    "label": "Gl Disk Io"
  },
  {
    "type": "gl-disk-space",
    "component": "GlDiskSpace",
    "label": "Gl Disk Space"
  },
  {
    "type": "gl-ip-address",
    "component": "GlIpAddress",
    "label": "Gl Ip Address"
  },
  {
    "type": "gl-load-history",
    "component": "GlLoadHistory",
    "label": "Gl Load History"
  },
  {
    "type": "gl-current-mem",
    "component": "GlMemGauge",
    "label": "Gl Mem Gauge"
  },
  {
    "type": "gl-mem-speedometer",
    "component": "GlMemSpeedometer",
    "label": "Gl Mem Speedometer"
  },
  {
    "type": "gl-mem-history",
    "component": "GlMemHistory",
    "label": "Gl Mem History"
  },
  {
    "type": "gl-network-interfaces",
    "component": "GlNetworkInterfaces",
    "label": "Gl Network Interfaces"
  },
  {
    "type": "gl-network-traffic",
    "component": "GlNetworkTraffic",
    "label": "Gl Network Traffic"
  },
  {
    "type": "gl-system-load",
    "component": "GlSystemLoad",
    "label": "Gl System Load"
  },
  {
    "type": "gl-uptime",
    "component": "GlancesUptime",
    "label": "Glances Uptime"
  },
  {
    "type": "gl-cpu-temp",
    "component": "GlCpuTemp",
    "label": "Gl Cpu Temp"
  },
  {
    "type": "gl-gpu",
    "component": "GlGpu",
    "label": "Gl Gpu"
  },
  {
    "type": "gluetun-status",
    "component": "GluetunStatus",
    "label": "Gluetun Status"
  },
  {
    "type": "health-checks",
    "component": "HealthChecks",
    "label": "Health Checks"
  },
  {
    "type": "hackernews-trending",
    "component": "HackernewsTrending",
    "label": "Hackernews Trending"
  },
  {
    "type": "iframe",
    "component": "IframeWidget",
    "label": "Iframe Widget"
  },
  {
    "type": "image",
    "component": "ImageWidget",
    "label": "Image Widget"
  },
  {
    "type": "joke",
    "component": "Jokes",
    "label": "Jokes"
  },
  {
    "type": "linkding",
    "component": "Linkding",
    "label": "Linkding"
  },
  {
    "type": "live-tennis",
    "component": "LiveTennis",
    "label": "Live Tennis"
  },
  {
    "type": "minecraft-status",
    "component": "MinecraftStatus",
    "label": "Minecraft Status"
  },
  {
    "type": "mullvad-status",
    "component": "MullvadStatus",
    "label": "Mullvad Status"
  },
  {
    "type": "mvg",
    "component": "Mvg",
    "label": "Mvg"
  },
  {
    "type": "mvg-connection",
    "component": "MvgConnection",
    "label": "Mvg Connection"
  },
  {
    "type": "nd-cpu-history",
    "component": "NdCpuHistory",
    "label": "Nd Cpu History"
  },
  {
    "type": "nd-load-history",
    "component": "NdLoadHistory",
    "label": "Nd Load History"
  },
  {
    "type": "nd-ram-history",
    "component": "NdRamHistory",
    "label": "Nd Ram History"
  },
  {
    "type": "news-headlines",
    "component": "NewsHeadlines",
    "label": "News Headlines"
  },
  {
    "type": "nextcloud-notifications",
    "component": "NextcloudNotifications",
    "label": "Nextcloud Notifications"
  },
  {
    "type": "nextcloud-php-opcache",
    "component": "NextcloudPhpOpcache",
    "label": "Nextcloud Php Opcache"
  },
  {
    "type": "nextcloud-stats",
    "component": "NextcloudStats",
    "label": "Nextcloud Stats"
  },
  {
    "type": "nextcloud-system",
    "component": "NextcloudSystem",
    "label": "Nextcloud System"
  },
  {
    "type": "nextcloud-user",
    "component": "NextcloudUser",
    "label": "Nextcloud User"
  },
  {
    "type": "nextcloud-user-status",
    "component": "NextcloudUserStatus",
    "label": "Nextcloud User Status"
  },
  {
    "type": "ntfy-stream",
    "component": "NtfyStream",
    "label": "Ntfy Stream"
  },
  {
    "type": "pi-hole-stats",
    "component": "PiHoleStats",
    "label": "Pi Hole Stats"
  },
  {
    "type": "pi-hole-stats-v6",
    "component": "PiHoleStatsV6",
    "label": "Pi Hole Stats V6"
  },
  {
    "type": "pi-hole-top-queries",
    "component": "PiHoleTopQueries",
    "label": "Pi Hole Top Queries"
  },
  {
    "type": "pi-hole-top-queries-v6",
    "component": "PiHoleTopQueriesV6",
    "label": "Pi Hole Top Queries V6"
  },
  {
    "type": "pi-hole-traffic",
    "component": "PiHoleTraffic",
    "label": "Pi Hole Traffic"
  },
  {
    "type": "pi-hole-traffic-v6",
    "component": "PiHoleTrafficV6",
    "label": "Pi Hole Traffic V6"
  },
  {
    "type": "proxmox-lists",
    "component": "Proxmox",
    "label": "Proxmox"
  },
  {
    "type": "public-holidays",
    "component": "PublicHolidays",
    "label": "Public Holidays"
  },
  {
    "type": "public-ip",
    "component": "PublicIp",
    "label": "Public Ip"
  },
  {
    "type": "rescue-time",
    "component": "RescueTime",
    "label": "Rescue Time"
  },
  {
    "type": "rss-feed",
    "component": "RssFeed",
    "label": "Rss Feed"
  },
  {
    "type": "sabnzbd",
    "component": "Sabnzbd",
    "label": "Sabnzbd"
  },
  {
    "type": "sports-scores",
    "component": "SportsScores",
    "label": "Sports Scores"
  },
  {
    "type": "stat-ping",
    "component": "StatPing",
    "label": "Stat Ping"
  },
  {
    "type": "stock-price-chart",
    "component": "StockPriceChart",
    "label": "Stock Price Chart"
  },
  {
    "type": "synology-download",
    "component": "SynologyDownload",
    "label": "Synology Download"
  },
  {
    "type": "system-info",
    "component": "SystemInfo",
    "label": "System Info"
  },
  {
    "type": "tfl-status",
    "component": "TflStatus",
    "label": "Tfl Status"
  },
  {
    "type": "trmm",
    "component": "TacticalRMM",
    "label": "Tactical RMM"
  },
  {
    "type": "uptime-kuma",
    "component": "UptimeKuma",
    "label": "Uptime Kuma"
  },
  {
    "type": "uptime-kuma-status-page",
    "component": "UptimeKumaStatusPage",
    "label": "Uptime Kuma Status Page"
  },
  {
    "type": "wallet-balance",
    "component": "WalletBalance",
    "label": "Wallet Balance"
  },
  {
    "type": "weather",
    "component": "Weather",
    "label": "Weather"
  },
  {
    "type": "weather-forecast",
    "component": "WeatherForecast",
    "label": "Weather Forecast"
  },
  {
    "type": "xkcd-comic",
    "component": "XkcdComic",
    "label": "Xkcd Comic"
  },
  {
    "type": "gl-compact-metrics",
    "component": "GlCompactMetrics",
    "label": "Gl Compact Metrics"
  }
];
