import type { SVGProps } from "react";

/**
 * Inline icon set for the dashboard. Replaces the prototype's Tabler webfont
 * with dependency-free, stroke-based SVGs that inherit `currentColor`.
 *
 * Usage: <Icon name="compass" /> or the named component <Compass />.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & { size?: number; strokeWidth?: number };

function base({ size = 20, strokeWidth = 1.6, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

export const Home = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
export const Compass = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);
export const Briefcase = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);
export const Kanban = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="6" height="16" rx="1.5" />
    <rect x="15" y="4" width="6" height="10" rx="1.5" />
  </svg>
);
export const FileText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);
export const Wallet = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2v0" />
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <circle cx="16" cy="13" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
export const Map = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);
export const MapPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.2" />
  </svg>
);
export const News = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h12a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />
    <path d="M17 8h2a1 1 0 0 1 1 1v9" />
    <path d="M7 8h6M7 12h6M7 16h4" />
  </svg>
);
export const Trending = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 17l6-6 4 4 7-7" />
    <path d="M17 8h4v4" />
  </svg>
);
export const Users = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.4M21 20a6 6 0 0 0-4-5.6" />
  </svg>
);
export const Bookmark = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 4h12v16l-6-4-6 4z" />
  </svg>
);
export const Sparkles = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3z" />
    <path d="M18 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
);
export const ShoppingBag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
export const School = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 9l9-4 9 4-9 4z" />
    <path d="M7 11v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4" />
    <path d="M21 9v5" />
  </svg>
);
export const Gift = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="9" width="16" height="11" rx="1.5" />
    <path d="M2 9h20M12 9v11" />
    <path d="M12 9S9 4 6.5 5.5 9.5 9 12 9zM12 9s3-5 5.5-3.5S14.5 9 12 9z" />
  </svg>
);
export const User = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
export const Bell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);
export const Plus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Lock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const Shield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l7 2.5v5C19 16 15.5 19.5 12 21c-3.5-1.5-7-5-7-10.5v-5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const Star = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
    <path d="M12 2.5l2.9 6.1 6.6.6-5 4.4 1.5 6.5L12 17.6 6 20.6l1.5-6.5-5-4.4 6.6-.6z" />
  </svg>
);
export const Check = (p: IconProps) => (
  <svg {...base({ ...p, strokeWidth: 2 })}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);
export const Verified = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...rest}>
    <path
      d="M12 2l2.6 1.6 3-.3 1.4 2.7 2.7 1.4-.3 3L23 14l-1.6 2.6.3 3-2.7 1.4-1.4 2.7-3-.3L12 25l-2.6-1.6-3 .3-1.4-2.7L2.3 19.6l.3-3L1 14l1.6-2.6-.3-3 2.7-1.4L6.4 4.3l3 .3z"
      transform="scale(0.92) translate(1 -1)"
      fill="currentColor"
    />
    <path d="M8.5 12.2l2.4 2.3L15.5 9.8" stroke="#08090c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Search = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
export const ArrowUpRight = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base({ size, strokeWidth: 1.6, ...rest })}>
    <path d="M6 18L18 6M18 6H9M18 6v9" />
  </svg>
);
export const ChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const Menu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const X = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Logout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    <path d="M10 12h11M18 9l3 3-3 3" />
  </svg>
);
export const Camera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);
export const Video = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="M16 10l5-3v10l-5-3z" />
  </svg>
);
export const Drone = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" />
    <path d="M7.7 7.7L9 9M16.3 7.7L15 9M9 15l-2 3M15 15l2 3" />
  </svg>
);
export const Upload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 16V5M8 9l4-4 4 4" />
    <path d="M5 19h14" />
  </svg>
);
export const Heart = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base({ size, strokeWidth: 1.5, ...rest })}>
    <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" />
  </svg>
);
export const Comment = ({ size = 16, ...rest }: IconProps) => (
  <svg {...base({ size, strokeWidth: 1.5, ...rest })}>
    <path d="M4 5h16v11H8l-4 3z" />
  </svg>
);
export const Play = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 6l11 6-11 6z" fill="currentColor" />
  </svg>
);
export const List = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);
export const Layout = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M9 9v11" />
  </svg>
);
export const Building = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" />
    <path d="M14 10h4a1 1 0 0 1 1 1v10M3 21h18" />
    <path d="M8 8h2M8 12h2M8 16h2" />
  </svg>
);
export const Clock = ({ size = 14, ...rest }: IconProps) => (
  <svg {...base({ size, ...rest })}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const Target = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
export const Download = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);
export const Send = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7z" />
  </svg>
);
export const Globe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.5 2.5 15 0 18c-2.5-3-2.5-15.5 0-18z" />
  </svg>
);
export const Instagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
);
export const Mail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const Folder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
export const Calendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
);
export const Chart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M7 16l3-4 3 2 4-6" />
  </svg>
);
export const Grid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const ICONS = {
  home: Home,
  compass: Compass,
  briefcase: Briefcase,
  kanban: Kanban,
  file: FileText,
  wallet: Wallet,
  map: Map,
  pin: MapPin,
  news: News,
  trending: Trending,
  users: Users,
  bookmark: Bookmark,
  sparkles: Sparkles,
  shop: ShoppingBag,
  school: School,
  gift: Gift,
  user: User,
  bell: Bell,
  plus: Plus,
  lock: Lock,
  shield: Shield,
  star: Star,
  check: Check,
  verified: Verified,
  search: Search,
  arrow: ArrowUpRight,
  chevron: ChevronRight,
  menu: Menu,
  x: X,
  logout: Logout,
  camera: Camera,
  video: Video,
  drone: Drone,
  upload: Upload,
  heart: Heart,
  comment: Comment,
  play: Play,
  list: List,
  layout: Layout,
  building: Building,
  clock: Clock,
  target: Target,
  download: Download,
  send: Send,
  globe: Globe,
  instagram: Instagram,
  mail: Mail,
  folder: Folder,
  calendar: Calendar,
  chart: Chart,
  grid: Grid,
  escrow: Shield,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: { name: IconName } & IconProps) {
  const Cmp = ICONS[name];
  return <Cmp {...props} />;
}
