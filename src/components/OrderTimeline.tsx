const statusColors: Record<string, { dot: string; text: string }> = {
  pending: { dot: 'bg-yellow-400', text: 'text-yellow-700' },
  confirmed: { dot: 'bg-blue-400', text: 'text-blue-700' },
  processing: { dot: 'bg-indigo-400', text: 'text-indigo-700' },
  shipped: { dot: 'bg-purple-500', text: 'text-purple-700' },
  delivered: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  cancelled: { dot: 'bg-red-500', text: 'text-red-700' },
};

function getColors(status: string) {
  return statusColors[status] ?? { dot: 'bg-gray-400', text: 'text-gray-600' };
}

interface TimelineEvent {
  _id: string;
  status: string;
  note?: string;
  created_at: number;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export default function OrderTimeline({ events }: OrderTimelineProps) {
  if (!events || events.length === 0) {
    return <p className="text-xs text-[#6E6E6E]">No status events yet.</p>;
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#111]/10" />
      {events.map((event, i) => {
        const colors = getColors(event.status);
        const isLast = i === events.length - 1;
        return (
          <div key={event._id} className="relative pb-4 last:pb-0">
            <div
              className={`absolute left-[-15px] top-1.5 w-[12px] h-[12px] rounded-full border-2 border-white ${colors.dot} ${
                isLast ? 'ring-2 ring-offset-1 ring-[#111]/10' : ''
              }`}
            />
            <div className="ml-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-medium uppercase tracking-widest ${colors.text}`}
                >
                  {event.status}
                </span>
                <span className="text-xs text-[#6E6E6E]">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
              {event.note && (
                <p className="text-xs text-[#6E6E6E] mt-0.5">{event.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  const classes = colorMap[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 border ${classes}`}
    >
      {status}
    </span>
  );
}
