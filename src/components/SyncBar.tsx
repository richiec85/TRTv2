import React from 'react';

interface SyncBarProps {
    syncStatus: { status: 'idle' | 'syncing' | 'ok' | 'error'; msg: string };
    githubConfigured: boolean;
    stravaConfigured: boolean;
    garminConfigured: boolean;
    onConfigureGitHub: () => void;
    onConfigureStrava: () => void;
    onConfigureGarmin: () => void;
    onSyncStrava: () => void;
    onSyncGarmin: () => void;
    onImportMfp: () => void;
}

const SyncBar: React.FC<SyncBarProps> = ({
    syncStatus,
    githubConfigured,
    stravaConfigured,
    garminConfigured,
    onConfigureGitHub,
    onConfigureStrava,
    onConfigureGarmin,
    onSyncStrava,
    onSyncGarmin,
    onImportMfp,
}) => {
    const statusColor = {
        idle: 'var(--muted)',
        syncing: '#00d4ff',
        ok: '#7fff6b',
        error: '#ff5050',
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            borderTop: '1px solid var(--border)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            zIndex: 1000,
            fontSize: 11,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: statusColor[syncStatus.status],
                flex: 1,
                minWidth: 150,
            }}>
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: statusColor[syncStatus.status],
                        boxShadow: syncStatus.status === 'syncing' ? '0 0 8px currentColor' : 'none',
                    }}
                />
                {syncStatus.msg || 'Offline - data saved locally'}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                    onClick={onConfigureGitHub}
                    style={{
                        padding: '6px 12px',
                        fontSize: 10,
                        background: githubConfigured ? 'rgba(0, 212, 255, 0.12)' : 'transparent',
                        color: githubConfigured ? 'var(--accent)' : 'var(--muted)',
                        border: githubConfigured ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    GitHub
                </button>

                <button
                    onClick={onConfigureStrava}
                    style={{
                        padding: '6px 12px',
                        fontSize: 10,
                        background: stravaConfigured ? 'rgba(127, 255, 107, 0.12)' : 'transparent',
                        color: stravaConfigured ? 'var(--accent2)' : 'var(--muted)',
                        border: stravaConfigured ? '1px solid rgba(127, 255, 107, 0.3)' : '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    Strava
                </button>

                <button
                    onClick={onConfigureGarmin}
                    style={{
                        padding: '6px 12px',
                        fontSize: 10,
                        background: garminConfigured ? 'rgba(199, 125, 255, 0.12)' : 'transparent',
                        color: garminConfigured ? 'var(--accent4)' : 'var(--muted)',
                        border: garminConfigured ? '1px solid rgba(199, 125, 255, 0.3)' : '1px solid var(--border)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    Garmin
                </button>

                <button
                    onClick={onImportMfp}
                    style={{
                        padding: '6px 12px',
                        fontSize: 10,
                        background: 'rgba(255, 209, 102, 0.12)',
                        color: 'var(--accent5)',
                        border: '1px solid rgba(255, 209, 102, 0.3)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    Import MFP
                </button>
            </div>
        </div>
    );
};

export default SyncBar;