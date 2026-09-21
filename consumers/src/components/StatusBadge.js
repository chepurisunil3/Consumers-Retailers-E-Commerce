import { ITEM_STATUS_LABELS } from "../services/api";

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{ITEM_STATUS_LABELS[status] || status}</span>;
}
