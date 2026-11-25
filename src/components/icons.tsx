import {
  Home,
  Video,
  CirclePlay,
  BookOpen,
  PenLine,
  ClipboardCheck,
  Award,
  FolderOpen,
  CalendarDays,
  Bell,
  Settings,
  Users,
  type LucideProps,
} from "lucide-react";
const icons = {
  home: Home,
  video: Video,
  play: CirclePlay,
  book: BookOpen,
  pen: PenLine,
  check: ClipboardCheck,
  award: Award,
  folder: FolderOpen,
  calendar: CalendarDays,
  bell: Bell,
  settings: Settings,
  users: Users,
};
export function Icon({ name, ...props }: LucideProps & { name: string }) {
  const Component = icons[name as keyof typeof icons] ?? BookOpen;
  return <Component size={18} strokeWidth={1.7} {...props} />;
}
