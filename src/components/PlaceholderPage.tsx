import { Link } from "@remix-run/react";

export default function PlaceholderPage({
  title,
  description,
  ctaLabel = "Back to Home",
  ctaHref = "/",
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-1xl mx-auto bg-white border border-[#111]/10 p-8 space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">In Progress</p>
        <h1 className="font-display text-1xl">{title}</h1>
        <p className="text-sm text-[#6E6E6E] leading-relaxed">{description}</p>
        <Link to={ctaHref} className="btn-primary inline-block">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
