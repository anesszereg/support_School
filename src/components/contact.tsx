import { MessageCircle } from "lucide-react";
export function Contact({
  label = "تواصل مع الأستاذ",
  phone,
  className = "btn",
}: {
  label?: string;
  phone?: string;
  className?: string;
}) {
  const number = (phone || process.env.NEXT_PUBLIC_CONTACT_PHONE || "").replace(
    /\D/g,
    "",
  );
  return (
    <a
      className={className}
      href={number ? `https://wa.me/${number}` : "/#contact"}
      {...(number ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <MessageCircle size={17} />
      {label}
    </a>
  );
}
