import * as RadixTooltip from '@radix-ui/react-tooltip';
import { type ReactNode } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={600}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            style={{
              background: '#0e0f0c',
              color: '#e2f6d5',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
              userSelect: 'none',
              zIndex: 100,
              maxWidth: '200px',
              lineHeight: '1.4',
            }}
          >
            {content}
            <RadixTooltip.Arrow
              style={{
                fill: '#0e0f0c',
              }}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
