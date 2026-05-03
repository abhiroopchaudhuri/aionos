import * as RadixTabs from '@radix-ui/react-tabs';
import { type ReactNode } from 'react';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabItem[];
  children?: ReactNode;
  wrap?: boolean;
}

export function Tabs({ value, onValueChange, tabs, children, wrap = false }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List
        style={{
          display: 'flex',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap: '4px',
          marginBottom: '20px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          return (
            <RadixTabs.Trigger
              key={tab.value}
              value={tab.value}
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#0e0f0c' : 'rgba(14, 15, 12, 0.06)',
                color: isActive ? '#9fe870' : '#454745',
                transition: 'background 100ms ease, color 100ms ease',
                outline: 'none',
                whiteSpace: 'nowrap',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #9fe870';
                (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline = 'none';
              }}
            >
              {tab.label}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}
