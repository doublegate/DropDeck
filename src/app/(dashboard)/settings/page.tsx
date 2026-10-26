'use client';

import { Laptop, Link2, Moon, Sun, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

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
        const [platRes, prefRes] = await Promise.all([
          fetch('/api/trpc/platform.list'),
          fetch('/api/trpc/preference.get'),
        ]);
        if (platRes.ok) {
          const platJson = (await platRes.json()) as { result?: { data?: PlatformItem[] } };
          if (Array.isArray(platJson?.result?.data)) {
            setPlatforms(platJson.result.data);
          }
        }
        if (prefRes.ok) {
          const prefJson = (await prefRes.json()) as {
            result?: { data?: Partial<PreferenceState> };
          };
          if (prefJson?.result?.data) {
            setPrefs((prev) => ({ ...prev, ...prefJson.result?.data }));
          }
        }
      } catch {
        // Fallback to defaults
      }
    }
    void loadSettings();
  }, []);

  const handleTogglePreference = useCallback((key: keyof PreferenceState, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    void fetch('/api/trpc/preference.update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => {});
  }, []);

  const handleConnectPlatform = useCallback((platformId: string) => {
    void fetch('/api/trpc/platform.connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId }),
    }).catch(() => {});
    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: true } : p)));
  }, []);

  const handleDisconnectPlatform = useCallback((platformId: string) => {
    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p)));
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-desc"
            className="w-full max-w-md rounded-xl border border-[var(--dd-border)] bg-[var(--dd-bg-card)] p-6 shadow-lg"
          >
            <h2
              id="delete-account-dialog-title"
              className="text-lg font-semibold text-[var(--dd-text-primary)]"
            >
              Delete Account
            </h2>
            <p id="delete-account-dialog-desc" className="mt-2 text-sm text-[var(--dd-text-muted)]">
              Are you sure you want to permanently delete your account? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(false)}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
