import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, Fragment } from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  return (
    <main style={{ background: 'var(--background)', minHeight: '100dvh', fontFamily: 'inherit', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--muted-foreground)', marginBottom: 4 }}>
          OASIS STUDIO
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 32, color: 'var(--foreground)' }}>
          Lead Acquisition
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Loading CRM...</p>
      </div>
    </main>
  );
}
