import type { ReactNode } from 'react';
import './presentChrome.css';

interface AppToolbarProps {
  title?: string;
  children?: ReactNode;
}

export function AppToolbar({ title, children }: AppToolbarProps) {
  return (
    <header className="present-toolbar app-toolbar">
      {children}
      {title ? <div className="present-toolbar-title">{title}</div> : null}
    </header>
  );
}
