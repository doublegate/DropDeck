'use client';

import { Laptop, Link2, Moon, Sun, Trash2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import superjson from 'superjson';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import type { NotificationSettings } from '@/types/platform';

interface PlatformItem {
  id: string;
  name: string;
  color: string;
  connected: boolean;
}

const DEFAULT_PLATFORMS: PlatformItem[] = [
  { id: 'doordash', name: 'DoorDash', color: '#FF3008', connected: true },
  { id: 'ubereats', name: 'Uber Eats', color: '#06C167', connected: true },
  { id: 'instacart', name: 'Instacart', color: '#43B02A', connected: true },
  { id: 'amazon', name: 'Amazon', color: '#FF9900', connected: false },
];

interface PreferenceState {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  driverAssigned: boolean;
  outForDelivery: boolean;
  arrivingSoon: boolean;
  delivered: boolean;
  delayed: boolean;
}

const DEFAULT_PREFS: PreferenceState = {
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  driverAssigned: true,
  outForDelivery: true,
  arrivingSoon: true,
  delivered: true,
  delayed: true,
};

function unwrapTrpcData<T>(payload: unknown): T | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const result = (payload as { result?: { data?: unknown } }).result;
  const data = result?.data;
  if (!data) return undefined;
  if (typeof data === 'object' && data !== null && 'json' in data) {
    return superjson.deserialize(data as Parameters<typeof superjson.deserialize>[0]) as T;
  }
  return data as T;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformItem[]>(DEFAULT_PLATFORMS);
  const [prefs, setPrefs] = useState<PreferenceState>(DEFAULT_PREFS);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadSettings() {
      try {
        const [connRes, listRes, prefRes] = await Promise.all([
          fetch('/api/trpc/platform.getConnections').catch(() => null),
          fetch('/api/trpc/platform.list').catch(() => null),
          fetch('/api/trpc/preference.get').catch(() => null),
        ]);

        if (listRes?.ok) {
          const listData = unwrapTrpcData<PlatformItem[]>(await listRes.json());
          if (Array.isArray(listData) && listData[0] && 'name' in listData[0]) {
            setPlatforms(listData);
          }
        } else if (connRes?.ok) {
          const connData = unwrapTrpcData<
            Array<{
              platform?: string;
              status?: string;
              id?: string;
              name?: string;
              color?: string;
              connected?: boolean;
            }>
          >(await connRes.json());
          if (Array.isArray(connData)) {
            if (connData[0] && 'name' in connData[0]) {
              setPlatforms(connData as PlatformItem[]);
            } else {
              const connectedMap = new Map(
                connData
                  .filter((c) => typeof c.platform === 'string')
                  .map((c) => [c.platform as string, c.status === 'connected'])
              );
              setPlatforms(
                DEFAULT_PLATFORMS.map((p) => ({
                  ...p,
                  connected: connectedMap.get(p.id) ?? false,
                }))
              );
            }
          }
        }

        if (prefRes?.ok) {
          const prefData = unwrapTrpcData<
            Partial<PreferenceState> & {
              notificationsEnabled?: boolean;
              notificationSettings?: Partial<NotificationSettings> | null;
            }
          >(await prefRes.json());
          if (prefData) {
            const ns = prefData.notificationSettings ?? {};
            const globalEnabled = prefData.notificationsEnabled ?? true;
            setPrefs((prev) => ({
              ...prev,
              pushEnabled: prefData.pushEnabled ?? ns.pushEnabled ?? globalEnabled,
              inAppEnabled: prefData.inAppEnabled ?? ns.inAppEnabled ?? globalEnabled,
              soundEnabled: prefData.soundEnabled ?? ns.soundEnabled ?? prev.soundEnabled,
              driverAssigned: prefData.driverAssigned ?? ns.driverAssigned ?? prev.driverAssigned,
              outForDelivery: prefData.outForDelivery ?? ns.outForDelivery ?? prev.outForDelivery,
              arrivingSoon: prefData.arrivingSoon ?? ns.arrivingSoon ?? prev.arrivingSoon,
              delivered: prefData.delivered ?? ns.delivered ?? prev.delivered,
              delayed: prefData.delayed ?? ns.delayed ?? prev.delayed,
            }));
          }
        }
      } catch {
        // Fallback to defaults
      }
    }
    void loadSettings();
  }, []);

  const handleTogglePreference = useCallback(
    async (key: keyof PreferenceState, value: boolean) => {
      const previousPrefs = prefs;
      const nextPrefs: PreferenceState = { ...prefs, [key]: value };
      setPrefs(nextPrefs);
      try {
        const res = await fetch('/api/trpc/preference.update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: {
              notificationsEnabled: nextPrefs.pushEnabled || nextPrefs.inAppEnabled,
              notificationSettings: {
                pushEnabled: nextPrefs.pushEnabled,
                inAppEnabled: nextPrefs.inAppEnabled,
                soundEnabled: nextPrefs.soundEnabled,
                driverAssigned: nextPrefs.driverAssigned,
                outForDelivery: nextPrefs.outForDelivery,
                arrivingSoon: nextPrefs.arrivingSoon,
                delivered: nextPrefs.delivered,
                delayed: nextPrefs.delayed,
              },
            },
          }),
        });
        if (!res.ok) {
          setPrefs(previousPrefs);
        }
      } catch {
        setPrefs(previousPrefs);
      }
    },
    [prefs]
  );

  const handleConnectPlatform = useCallback(async (platformId: string) => {
    try {
      const payload = JSON.stringify({ json: { platform: platformId } });
      let res = await fetch('/api/trpc/platform.initiateOAuth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!res.ok) {
        res = await fetch('/api/trpc/platform.connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      }
      if (!res.ok) return;
      const data = unwrapTrpcData<{ authUrl?: string; success?: boolean }>(await res.json());
      if (data?.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      setPlatforms((prev) =>
        prev.map((p) => (p.id === platformId ? { ...p, connected: true } : p))
      );
    } catch {
      // Do not mark connected when request fails
    }
  }, []);

  const handleDisconnectPlatform = useCallback(async (platformId: string) => {
    try {
      const res = await fetch('/api/trpc/platform.disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { platform: platformId } }),
      });
      if (!res.ok) return;
      setPlatforms((prev) =>
        prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
      );
    } catch {
      // Do not mark disconnected when request fails
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/trpc/user.deleteAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: null }),
      });
      if (!res.ok) return;
      setShowDeleteConfirm(false);
      await signOut({ callbackUrl: '/login' });
    } catch {
      // Keep dialog open on failure
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--dd-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--dd-text-muted)]">
          Manage your connected platforms, notification preferences, and account settings.
        </p>
      </div>

      {/* Platform Connections */}
      <Card data-testid="platform-connections" className="platform-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Platform Connections
          </CardTitle>
          <CardDescription>Connect and manage your delivery platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="flex items-center justify-between rounded-lg border border-[var(--dd-border)] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="text-sm font-medium text-[var(--dd-text-primary)]">
                  {platform.name}
                </span>
              </div>
              {platform.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnectPlatform(platform.id)}
                >
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => handleConnectPlatform(platform.id)}>
                  Connect
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card data-testid="notification-settings">
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Choose how and when you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="push-toggle" className="text-sm font-medium">
              Push Notifications
            </label>
            <Switch
              id="push-toggle"
              data-testid="push-toggle"
              aria-label="Push Notifications"
              checked={prefs.pushEnabled}
              onCheckedChange={(checked) => handleTogglePreference('pushEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="in-app-toggle" className="text-sm font-medium">
              In-App Notifications
            </label>
            <Switch
              id="in-app-toggle"
              data-testid="in-app-toggle"
              aria-label="In-App Notifications"
              checked={prefs.inAppEnabled}
              onCheckedChange={(checked) => handleTogglePreference('inAppEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="sound-toggle" className="text-sm font-medium">
              Sound Notifications
            </label>
            <Switch
              id="sound-toggle"
              data-testid="sound-toggle"
              aria-label="Sound Notifications"
              checked={prefs.soundEnabled}
              onCheckedChange={(checked) => handleTogglePreference('soundEnabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="driver-assigned-toggle" className="text-sm font-medium">
              Driver Assigned
            </label>
            <Switch
              id="driver-assigned-toggle"
              data-testid="driver-assigned-toggle"
              aria-label="Driver Assigned"
              checked={prefs.driverAssigned}
              onCheckedChange={(checked) => handleTogglePreference('driverAssigned', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="out-for-delivery-toggle" className="text-sm font-medium">
              Out for Delivery
            </label>
            <Switch
              id="out-for-delivery-toggle"
              data-testid="out-for-delivery-toggle"
              aria-label="Out for Delivery"
              checked={prefs.outForDelivery}
              onCheckedChange={(checked) => handleTogglePreference('outForDelivery', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="arriving-soon-toggle" className="text-sm font-medium">
              Arriving Soon
            </label>
            <Switch
              id="arriving-soon-toggle"
              data-testid="arriving-soon-toggle"
              aria-label="Arriving Soon"
              checked={prefs.arrivingSoon}
              onCheckedChange={(checked) => handleTogglePreference('arrivingSoon', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card data-testid="theme-selector">
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Customize the appearance of DropDeck</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant={mounted && theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={mounted && theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={mounted && theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('system')}
          >
            <Laptop className="mr-2 h-4 w-4" />
            System
          </Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card data-testid="account-settings">
        <CardHeader>
          <CardTitle className="text-lg">Account Management</CardTitle>
          <CardDescription>Manage your account and data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-account-dialog-title"
          aria-describedby="delete-account-dialog-desc"
        >
          <DialogHeader>
            <DialogTitle id="delete-account-dialog-title">Delete Account</DialogTitle>
            <DialogDescription id="delete-account-dialog-desc">
              Are you sure you want to permanently delete your account? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteAccount()}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
