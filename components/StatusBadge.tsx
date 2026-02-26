interface StatusBadgeProps {
  status: string;
  variant?: "default" | "outline";
}

export default function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // Green - Success states
    if (statusLower.includes("order closed") || statusLower.includes("won") || statusLower.includes("approved") || statusLower.includes("active") || statusLower.includes("on track")) {
      return "bg-primary-100 text-primary-800 border-primary-200";
    }
    // Red - Lost/Rejected states
    if (statusLower.includes("order lost") || statusLower.includes("lost") || statusLower.includes("rejected") || statusLower.includes("expired")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    // Yellow - New/Pending states
    if (statusLower.includes("new lead") || statusLower.includes("pending") || statusLower.includes("new") || statusLower.includes("delayed")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    // Blue - Active progress states
    if (statusLower.includes("lead contacted") || statusLower.includes("meeting scheduled") || statusLower.includes("meeting completed") || statusLower.includes("contacted") || statusLower.includes("follow-up") || statusLower.includes("negotiation")) {
      return "bg-primary-100 text-primary-800 border-primary-200";
    }
    // Purple - Quotation/Manager states
    if (statusLower.includes("quotation sent") || statusLower.includes("manager deliberation")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const baseClasses = variant === "outline" 
    ? "border px-2 py-1 rounded-full text-xs font-medium"
    : "px-3 py-1 rounded-full text-xs font-medium border";

  return (
    <span className={`${baseClasses} ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}






















