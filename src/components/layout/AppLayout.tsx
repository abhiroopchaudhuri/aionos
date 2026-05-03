import { type ReactNode } from 'react';

interface AppLayoutProps {
  topBar: ReactNode;
  canvasArea: ReactNode;
  sidePanel: ReactNode;
}

export function AppLayout({ topBar, canvasArea, sidePanel }: AppLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100svh',
        overflow: 'hidden',
      }}
    >
      {topBar}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: '#0e0f0c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {canvasArea}
        </div>

        {/* Right panel */}
        <div
          style={{
            width: '380px',
            flexShrink: 0,
            background: '#ffffff',
            boxShadow: 'rgba(14, 15, 12, 0.12) -1px 0px 0px 0px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {sidePanel}
        </div>
      </div>
    </div>
  );
}
