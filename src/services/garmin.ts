import { GarminConfig, Activity } from '../types';
import { uid } from '../utils';

const GARMIN_API_BASE = 'https://api.garmin.com';

export function garminAuth(workerUrl: string): void {
  const redirect = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/') + 'index.html';
  window.location.href = `${workerUrl.replace(/\/$/, '')}/authorize?redirect_uri=${encodeURIComponent(redirect)}`;
}

export async function garminFetch(workerUrl: string, accessToken: string, path: string): Promise<any> {
  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api?path=${encodeURIComponent(path)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Garmin error: ${res.status}`);
  }

  return res.json();
}

export async function garminPullActivities(
  workerUrl: string,
  accessToken: string,
  sinceTs: number | null,
  onProgress?: (loaded: number, page: number) => void
): Promise<Omit<Activity, 'id' | 'source'>[]> {
  const after = sinceTs
    ? Math.floor(sinceTs / 1000)
    : Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 365 * 5) / 1000);

  const all: any[] = [];
  let page = 1;

  while (page <= 50) {
    if (onProgress) onProgress(all.length, page);

    try {
      const batch = await garminFetch(
        workerUrl,
        accessToken,
        `/wellness-api/rest/activities?startDate=${after}&limit=100&offset=${(page - 1) * 100}`
      );

      if (!Array.isArray(batch) || !batch.length) break;

      all.push(...batch);
      if (batch.length < 100) break;

      page++;
    } catch (e) {
      try {
        const batch = await garminFetch(
          workerUrl,
          accessToken,
          `/activitylist-service/activities/search/activities?startDate=${after}&limit=100&offset=${(page - 1) * 100}`
        );
        if (!Array.isArray(batch) || !batch.length) break;
        all.push(...batch);
        if (batch.length < 100) break;
        page++;
      } catch {
        break;
      }
    }
  }

  return all.map((a: any) => ({
    garminId: a.activityId || a.id,
    date: a.startTimeLocal || a.startTimeGMT || a.activityDate,
    type: a.activityType?.typeKey || a.type,
    name: a.activityName || a.name,
    durationMin: Math.round((a.duration || a.movingDuration || 0) / 60),
    distanceKm: +(((a.distance || a.totalDistance || 0) / 1000).toFixed(2)),
    kj: a.calories ? Math.round(a.calories * 4.184) : null,
  }));
}

export function isGarminConfigured(cfg: GarminConfig): boolean {
  return !!cfg.workerUrl && !!cfg.accessToken;
}