// Icônes SVG plates (flat, remplissage uni) utilisées pour les actions (modifier, archiver, supprimer)

export function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10a.75.75 0 0 0 0-1.5H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  )
}

export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5z" />
    </svg>
  )
}

export function ArchiveIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.801a2 2 0 0 1-1.99-1.79L2 7.5zM7.5 11a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 7.5 11z" />
    </svg>
  )
}

export function ArchiveRestoreIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.801a2 2 0 0 1-1.99-1.79L2 7.5zM10 9a.75.75 0 0 1 .53.22l2 2a.75.75 0 1 1-1.06 1.06l-.72-.72V15a.75.75 0 0 1-1.5 0v-3.44l-.72.72a.75.75 0 1 1-1.06-1.06l2-2A.75.75 0 0 1 10 9z" />
    </svg>
  )
}

export function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5z" />
    </svg>
  )
}
