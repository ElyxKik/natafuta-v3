export function UrgencyBadge({ level }: { level: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    low:      { cls: 'bg-blue-100 text-blue-800',   label: 'Urgence faible' },
    medium:   { cls: 'bg-yellow-100 text-yellow-800', label: 'Urgence moyenne' },
    high:     { cls: 'bg-orange-100 text-orange-800', label: 'Urgence élevée' },
    critical: { cls: 'bg-red-100 text-red-800',     label: 'Urgence critique' },
  };
  const { cls, label } = map[level] ?? map.medium;
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-red-100 text-red-800',   label: 'Disparue' },
    found:  { cls: 'bg-green-100 text-green-800', label: 'Retrouvée' },
    closed: { cls: 'bg-gray-100 text-gray-800',  label: 'Dossier fermé' },
  };
  const { cls, label } = map[status] ?? map.active;
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

export function SightingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:  { cls: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
    reviewed: { cls: 'bg-blue-100 text-blue-800',    label: 'Examiné' },
    verified: { cls: 'bg-green-100 text-green-800',  label: 'Vérifié' },
    false:    { cls: 'bg-red-100 text-red-800',      label: 'Faux' },
  };
  const { cls, label } = map[status] ?? map.pending;
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}

export function MatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:   { cls: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
    verified:  { cls: 'bg-blue-100 text-blue-800',    label: 'Vérifiée' },
    confirmed: { cls: 'bg-green-100 text-green-800',  label: 'Confirmée' },
    rejected:  { cls: 'bg-red-100 text-red-800',      label: 'Rejetée' },
  };
  const { cls, label } = map[status] ?? map.pending;
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>;
}
