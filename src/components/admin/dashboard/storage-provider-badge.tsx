'use client';

/**
 * @purpose Renderiza una notificacion emergente con el proveedor de almacenamiento activo.
 * @purpose_en Renders a badge displaying the active storage provider.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:14z1m65
 * @lastUpdated 2026-06-30T13:00:47.982Z
 */

import { useState, useEffect } from 'react';
import { HardDrive } from 'lucide-react';

export function StorageProviderBadge() {
  const [provider, setProvider] = useState('CARGANDO...');

  useEffect(() => {
    fetch('/files/api/v1/storage/active-provider')
      .then(r => r.ok ? r.json() : { provider: 'CLOUDINARY' })
      .then(d => setProvider(d.provider || 'CLOUDINARY'))
      .catch((e) => {
        console.warn('[STORAGE_PROVIDER] Fetch failed, using default', e);
        setProvider('CLOUDINARY');
      });
  }, []);

  return (
    <div className="bg-card border p-4 rounded flex items-center justify-between">
      <div className="flex items-center gap-2">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase">ALMACENAMIENTO_ACTIVO</span>
      </div>
      <div className="text-lg font-mono font-black text-primary uppercase">{provider}</div>
    </div>
  );
}
