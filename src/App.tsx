import React, { useEffect, useRef, useCallback } from 'react';
import useAppStore from './store/index';
import { useCompounds, useLogs, useCycles, useBodyMetrics, useBloods, useMacros, useActivities, useGitHubConfig, useStravaConfig, useGarminConfig, useSyncStatus, useLoaded, useAppActions } from './store/index';
import { fmt, today, nowDT, daysSince, weekKey, uid, emptyStore, normalize, migrateV1, debounce } from './utils';
import { isGitHubConfigured } from './services/github';
import { isStravaConfigured, stravaAuth } from './services/strava';
import { isGarminConfigured, garminAuth } from './services/garmin';
import { importMfpCsv } from './services/mfp';
import { SEEDED_COMPOUNDS, SCHEMA_VERSION, LOCAL_KEY, LEGACY_KEY, GH_CONFIG_KEY, STRAVA_CONFIG_KEY, GARMIN_CONFIG_KEY, INJECTION_SITES, TYPE_OPTIONS, FREQ_OPTIONS, PHASE_OPTIONS, BP_TARGET, BP_HIGH, NHS_RANGES, BLOOD_KEYS, SWATCHES } from './types';
import DashboardTab from './components/DashboardTab';
import LogTab from './components/LogTab';
import CyclesTab from './components/CyclesTab';
import HealthTab from './components/HealthTab';
import ChartsTab from './components/ChartsTab';
import ProtocolsTab from './components/ProtocolsTab';
import Modals from './components/Modals';
import SyncBar from './components/SyncBar';
import Empty from './components/Empty';

const S = {
    app: {
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        position: 'relative' as const,
    },
    bgGlow: {
        position: 'fixed' as const,
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        background: 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0, 212, 255, 0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(127, 255, 107, 0.04) 0%, transparent 60%)',
    },
    wrap: {
        position: 'relative' as const,
        zIndex: 1,
        maxWidth: 920,
        margin: '0 auto',
        padding: '0 14px 110px',
    },
    header: {
        padding: '24px 0 16px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.12)',
        marginBottom: 24,
    },
    logo: {
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'var(--accent)',
        textTransform: 'uppercase' as const,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(0, 212, 255, 0.5)',
        letterSpacing: '0.2em',
        marginTop: 2,
    },
    nav: {
        display: 'flex',
        gap: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 3,
        flexWrap: 'wrap' as const,
        marginTop: 14,
    },
    navBtn: (a: boolean) => ({
        padding: '7px 11px',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        background: a ? 'rgba(0, 212, 255, 0.14)' : 'transparent',
        color: a ? 'var(--accent)' : 'var(--muted)',
        border: a ? '1px solid rgba(0, 212, 255, 0.28)' : '1px solid transparent',
        borderRadius: 6,
        transition: 'all 0.15s',
        flex: '1 1 auto',
        fontWeight: 600,
    }),
    fab: {
        position: 'fixed' as const,
        bottom: 22,
        right: 22,
        zIndex: 100,
        background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
        color: '#080c12',
        border: 'none',
        borderRadius: '50%' as const,
        width: 56,
        height: 56,
        fontSize: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
    },
};

const App: React.FC = () => {
    const [tab, setTab] = React.useState<'dashboard' | 'log' | 'cycles' | 'health' | 'charts' | 'protocols'>('dashboard');
    const [healthSubtab, setHealthSubtab] = React.useState<'body' | 'bloods' | 'bp' | 'macros' | 'training'>('body');
    const [chartsSubtab, setChartsSubtab] = React.useState<'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods'>('doses');
    const [modal, setModal] = React.useState<{ type: string; [key: string]: any } | null>(null);

    const compounds = useCompounds();
    const logs = useLogs();
    const cycles = useCycles();
    const bodyMetrics = useBodyMetrics();
    const bloods = useBloods();
    const macros = useMacros();
    const activities = useActivities();
    const githubConfig = useGitHubConfig();
    const stravaConfig = useStravaConfig();
    const garminConfig = useGarminConfig();
    const syncStatus = useSyncStatus();
    const loaded = useLoaded();

    const {
        addLog,
        addCompound,
        addCycle,
        updateCycle,
        addBodyMetric,
        addBloodPanel,
        addMacro,
        addActivity,
        setCompounds,
        setLogs,
        setCycles,
        setBodyMetrics,
        setBloods,
        setMacros,
        setActivities,
        setGitHubConfig,
        clearGitHubConfig,
        setStravaConfig,
        clearStravaConfig,
        setGarminConfig,
        clearGarminConfig,
        setSyncStatus,
        setLoaded,
    } = useAppActions();

    const shaRef = useRef<string | null>(null);

    useEffect(() => {
        try {
            const sc = JSON.parse(localStorage.getItem(STRAVA_CONFIG_KEY) || '{}');
            if (sc.workerUrl) {
                setStravaConfig({ workerUrl: sc.workerUrl || '', refreshToken: sc.refreshToken || '', lastSync: sc.lastSync || null });
            }
        } catch {}

        try {
            const gc = JSON.parse(localStorage.getItem(GARMIN_CONFIG_KEY) || '{}');
            if (gc.workerUrl) {
                setGarminConfig({ workerUrl: gc.workerUrl || '', accessToken: gc.accessToken || '', refreshToken: gc.refreshToken || '', lastSync: gc.lastSync || null });
            }
        } catch {}

        const params = new URLSearchParams(window.location.search);
        if (params.get('strava_refresh')) {
            const rt = params.get('strava_refresh');
            const saved = JSON.parse(localStorage.getItem(STRAVA_CONFIG_KEY) || '{}');
            const cfg = { ...saved, refreshToken: rt };
            setStravaConfig(cfg);
            localStorage.setItem(STRAVA_CONFIG_KEY, JSON.stringify(cfg));
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (params.get('garmin_refresh')) {
            const rt = params.get('garmin_refresh');
            const saved = JSON.parse(localStorage.getItem(GARMIN_CONFIG_KEY) || '{}');
            const cfg = { ...saved, accessToken: rt };
            setGarminConfig(cfg);
            localStorage.setItem(GARMIN_CONFIG_KEY, JSON.stringify(cfg));
            window.history.replaceState({}, '', window.location.pathname);
        }

        try {
            const savedCfg = JSON.parse(localStorage.getItem(GH_CONFIG_KEY) || '{}');
            if (savedCfg?.token) {
                setGitHubConfig(savedCfg);
                loadFromGitHub(savedCfg);
                return;
            }
        } catch {}

        loadFromLocal();
    }, []);

    const loadFromLocal = () => {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        } catch {}

        if (!data) {
            try {
                const v1 = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
                if (v1) data = migrateV1(v1);
            } catch {}
        }

        if (data) {
            useAppStore.setState(normalize(data));
        }
        setLoaded(true);
    };

    const loadFromGitHub = async (cfg: { owner: string; repo: string; token: string }) => {
        setSyncStatus('syncing', 'Fetching from GitHub...');
        try {
            const { ghGet } = await import('./services/github');
            const { content, sha } = await ghGet(cfg);
            if (content) {
                useAppStore.setState(normalize(content));
                shaRef.current = sha;
            }
            setSyncStatus('ok', 'Loaded from GitHub');
        } catch (e: any) {
            setSyncStatus('error', e.message || 'Failed to load from GitHub');
        }
        setLoaded(true);
    };

    const saveToGitHub = useCallback(debounce(async () => {
        if (!isGitHubConfigured(githubConfig)) return;
        setSyncStatus('syncing', 'Saving to GitHub...');
        try {
            const { ghPut } = await import('./services/github');
            const state = useAppStore.getState();
            const data = {
                compounds: state.compounds,
                logs: state.logs,
                cycles: state.cycles,
                bodyMetrics: state.bodyMetrics,
                bloods: state.bloods,
                macros: state.macros,
                activities: state.activities,
                schemaVersion: SCHEMA_VERSION,
            };
            const newSha = await ghPut(githubConfig, data, shaRef.current);
            shaRef.current = newSha;
            setSyncStatus('ok', 'Saved to GitHub');
        } catch (e: any) {
            setSyncStatus('error', e.message || 'Failed to save to GitHub');
        }
    }, 2000), [githubConfig]);

    useEffect(() => {
        if (isGitHubConfigured(githubConfig) && loaded) {
            saveToGitHub();
        }
    }, [compounds, logs, cycles, bodyMetrics, bloods, macros, activities, githubConfig, loaded, saveToGitHub]);

    const last7 = logs.filter(l => {
        const d = new Date(l.datetime);
        return d >= new Date(Date.now() - 7 * 86400000);
    }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    const lastFor = (id: string) => logs.filter(l => l.compoundId === id).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0];

    const activeCycle = cycles.filter(c => !c.endDate || new Date(c.endDate) >= new Date()).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

    const injectionSites = [...INJECTION_SITES];
    const lastSites = last7.map(l => l.site).filter(Boolean);
    const unusedSites = injectionSites.filter(s => !lastSites.includes(s));
    const nextSite = unusedSites[0] || lastSites[0] || injectionSites[0];

    const handleOpenLog = (compound: Compound) => setModal({ type: 'log', compound });
    const handleOpenCompound = (compound?: Compound) => setModal({ type: 'compound', compound });
    const handleOpenCycle = (cycle?: Cycle) => setModal({ type: 'cycle', cycle });
    const handleOpenBody = (metric?: BodyMetric) => setModal({ type: 'body', metric });
    const handleOpenBlood = (panel?: BloodPanel) => setModal({ type: 'blood', panel });
    const handleImportMfp = () => setModal({ type: 'importMfp' });
    const handleSyncStrava = () => {
        if (isStravaConfigured(stravaConfig)) {
            setModal({ type: 'syncStrava' });
        } else {
            stravaAuth(stravaConfig.workerUrl || '');
        }
    };
    const handleSyncGarmin = () => {
        if (isGarminConfigured(garminConfig)) {
            setModal({ type: 'syncGarmin' });
        } else {
            garminAuth(garminConfig.workerUrl || '');
        }
    };
    const handleConfigureGitHub = () => setModal({ type: 'github' });
    const handleConfigureStrava = () => setModal({ type: 'strava' });
    const handleConfigureGarmin = () => setModal({ type: 'garmin' });

    const handleDeleteLog = (id: string) => {
        if (window.confirm('Delete this log entry?')) {
            useAppStore.getState().deleteLog(id);
        }
    };

    const handleDeleteCompound = (id: string) => {
        if (window.confirm('Delete this compound? This will also delete all related log entries.')) {
            useAppStore.getState().deleteCompound(id);
        }
    };

    const handleDeleteCycle = (id: string) => {
        if (window.confirm('Delete this cycle?')) {
            useAppStore.getState().deleteCycle(id);
        }
    };

    const handleDeleteBody = (id: string) => {
        if (window.confirm('Delete this body metric?')) {
            useAppStore.getState().deleteBodyMetric(id);
        }
    };

    const handleDeleteBlood = (id: string) => {
        if (window.confirm('Delete this blood panel?')) {
            useAppStore.getState().deleteBloodPanel(id);
        }
    };

    const handleDeleteMacro = (id: string) => {
        if (window.confirm('Delete this macro entry?')) {
            useAppStore.getState().deleteMacro(id);
        }
    };

    const handleDeleteActivity = (id: string) => {
        if (window.confirm('Delete this activity?')) {
            useAppStore.getState().deleteActivity(id);
        }
    };

    if (!loaded) {
        return (
            <div style={S.app}>
                <div style={S.bgGlow} />
                <div style={S.wrap}>
                    <div style={{ ...S.header, borderBottom: 'none' }}>
                        <div style={S.logo}>TRT TRACKER</div>
                        <div style={S.subtitle}>Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={S.app}>
            <div style={S.bgGlow} />
            <div style={S.wrap}>
                <div style={S.header}>
                    <div style={S.logo}>TRT TRACKER</div>
                    <div style={S.subtitle}>V2 - COMPREHENSIVE CYCLE TRACKING</div>
                    <div style={S.nav}>
                        {(['dashboard', 'log', 'cycles', 'health', 'charts', 'protocols'] as const).map(t => (
                            <button key={t} style={S.navBtn(tab === t)} onClick={() => setTab(t)}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'dashboard' && (
                    <DashboardTab
                        store={{ compounds, logs, cycles, bodyMetrics, bloods, macros, activities }}
                        last7={last7}
                        nextSite={nextSite}
                        lastFor={lastFor}
                        activeCycle={activeCycle}
                        onOpenLog={handleOpenLog}
                    />
                )}

                {tab === 'log' && (
                    <LogTab logs={logs} compounds={compounds} onDeleteLog={handleDeleteLog} />
                )}

                {tab === 'cycles' && (
                    <CyclesTab
                        cycles={cycles}
                        compounds={compounds}
                        logs={logs}
                        onDeleteCycle={handleDeleteCycle}
                        onOpenCycle={handleOpenCycle}
                    />
                )}

                {tab === 'health' && (
                    <HealthTab
                        subtab={healthSubtab}
                        onSubtab={setHealthSubtab}
                        bodyMetrics={bodyMetrics}
                        bloods={bloods}
                        macros={macros}
                        activities={activities}
                        onOpenBody={handleOpenBody}
                        onOpenBlood={handleOpenBlood}
                        onDeleteBody={handleDeleteBody}
                        onDeleteBlood={handleDeleteBlood}
                        onDeleteMacro={handleDeleteMacro}
                        onDeleteActivity={handleDeleteActivity}
                    />
                )}

                {tab === 'charts' && (
                    <ChartsTab
                        subtab={chartsSubtab}
                        onSubtab={setChartsSubtab}
                        compounds={compounds}
                        logs={logs}
                        bodyMetrics={bodyMetrics}
                        bloods={bloods}
                        macros={macros}
                        activities={activities}
                    />
                )}

                {tab === 'protocols' && (
                    <ProtocolsTab
                        compounds={compounds}
                        onOpenCompound={handleOpenCompound}
                        onDeleteCompound={handleDeleteCompound}
                    />
                )}

                <SyncBar
                    syncStatus={syncStatus}
                    githubConfigured={isGitHubConfigured(githubConfig)}
                    stravaConfigured={isStravaConfigured(stravaConfig)}
                    garminConfigured={isGarminConfigured(garminConfig)}
                    onConfigureGitHub={handleConfigureGitHub}
                    onConfigureStrava={handleConfigureStrava}
                    onConfigureGarmin={handleConfigureGarmin}
                    onSyncStrava={handleSyncStrava}
                    onSyncGarmin={handleSyncGarmin}
                    onImportMfp={handleImportMfp}
                />

                <Modals
                    modal={modal}
                    onClose={() => setModal(null)}
                    compounds={compounds}
                    cycles={cycles}
                    onAddLog={useAppStore.getState().addLog}
                    onAddCompound={useAppStore.getState().addCompound}
                    onUpdateCompound={useAppStore.getState().updateCompound}
                    onAddCycle={useAppStore.getState().addCycle}
                    onUpdateCycle={useAppStore.getState().updateCycle}
                    onAddBodyMetric={useAppStore.getState().addBodyMetric}
                    onAddBloodPanel={useAppStore.getState().addBloodPanel}
                    onAddMacro={useAppStore.getState().addMacro}
                    onAddActivity={useAppStore.getState().addActivity}
                    onImportMfp={importMfpCsv}
                    stravaConfig={stravaConfig}
                    garminConfig={garminConfig}
                    githubConfig={githubConfig}
                    onSetStravaConfig={setStravaConfig}
                    onSetGarminConfig={setGarminConfig}
                    onSetGitHubConfig={setGitHubConfig}
                />

                <button style={S.fab} onClick={() => setModal({ type: 'log' })}>
                    +
                </button>
            </div>
        </div>
    );
};

export default App;
