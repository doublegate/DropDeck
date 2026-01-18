'use client';

import { useState } from 'react';
import { BellRing, Volume2, VolumeX, Moon, Smartphone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

/**
 * Notification preferences
 */
export interface NotificationPrefs {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  driverAssigned: boolean;
  outForDelivery: boolean;
  arrivingSoon: boolean;
  delivered: boolean;
  delayed: boolean;
  platformStatus: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

/**
 * NotificationPreferences props
 */
interface NotificationPreferencesProps {
  /** Current preferences */
  preferences: NotificationPrefs;
  /** Callback when preference changes */
  onPreferenceChange: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K]
  ) => void;
  /** Request push permission */
  onRequestPushPermission?: () => Promise<void>;
  /** Push permission status */
  pushPermission?: NotificationPermission | 'unsupported';
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Preference toggle row component
 */
interface PreferenceRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  icon,
}: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon && <div className="text-[var(--dd-text-muted)]">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-[var(--dd-text-primary)]">{label}</p>
          {description && <p className="text-xs text-[var(--dd-text-muted)]">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/**
 * NotificationPreferences component
 * Settings UI for notification preferences
 */
export function NotificationPreferences({
  preferences,
  onPreferenceChange,
  onRequestPushPermission,
  pushPermission = 'default',
  isLoading: _isLoading = false,
  className,
}: NotificationPreferencesProps) {
  const [_isSaving, _setIsSaving] = useState(false);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && pushPermission !== 'granted' && onRequestPushPermission) {
      await onRequestPushPermission();
    }
    onPreferenceChange('pushEnabled', enabled);
  };

  const pushDisabled = pushPermission === 'denied' || pushPermission === 'unsupported';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <PreferenceRow
            icon={<Smartphone className="w-4 h-4" />}
            label="Push Notifications"
            description={
              pushDisabled
                ? 'Push notifications are blocked in your browser settings'
                : 'Receive notifications even when the app is closed'
            }
            checked={preferences.pushEnabled && !pushDisabled}
            onChange={handlePushToggle}
            disabled={pushDisabled}
          />
          <Separator />
          <PreferenceRow
            icon={<BellRing className="w-4 h-4" />}
            label="In-App Notifications"
            description="Show notifications within the app"
            checked={preferences.inAppEnabled}
            onChange={(checked) => onPreferenceChange('inAppEnabled', checked)}
          />
          <Separator />
          <PreferenceRow
            icon={
              preferences.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )
            }
            label="Sound"
            description="Play a sound when notifications arrive"
            checked={preferences.soundEnabled}
            onChange={(checked) => onPreferenceChange('soundEnabled', checked)}
          />
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Updates</CardTitle>
          <CardDescription>Select which delivery events to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <PreferenceRow
            label="Driver Assigned"
            description="When a driver is assigned to your order"
            checked={preferences.driverAssigned}
            onChange={(checked) => onPreferenceChange('driverAssigned', checked)}
          />
          <Separator />
          <PreferenceRow
            label="Out for Delivery"
            description="When your order is on the way"
            checked={preferences.outForDelivery}
            onChange={(checked) => onPreferenceChange('outForDelivery', checked)}
          />
          <Separator />
          <PreferenceRow
            label="Arriving Soon"
            description="When your order is almost there"
            checked={preferences.arrivingSoon}
            onChange={(checked) => onPreferenceChange('arrivingSoon', checked)}
          />
          <Separator />
          <PreferenceRow
            label="Delivered"
            description="When your order has been delivered"
            checked={preferences.delivered}
            onChange={(checked) => onPreferenceChange('delivered', checked)}
          />
          <Separator />
          <PreferenceRow
            label="Delays"
            description="When your order is running late"
            checked={preferences.delayed}
            onChange={(checked) => onPreferenceChange('delayed', checked)}
          />
        </CardContent>
      </Card>

      {/* Platform Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Status</CardTitle>
          <CardDescription>Notifications about your connected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferenceRow
            label="Platform Connection Status"
            description="When platforms are connected or disconnected"
            checked={preferences.platformStatus}
            onChange={(checked) => onPreferenceChange('platformStatus', checked)}
          />
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Pause notifications during certain hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            label="Enable Quiet Hours"
            description="Silence notifications during specified times"
            checked={preferences.quietHoursEnabled}
            onChange={(checked) => onPreferenceChange('quietHoursEnabled', checked)}
          />

          {preferences.quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="quiet-hours-start"
                    className="text-sm font-medium text-[var(--dd-text-primary)] mb-2 block"
                  >
                    Start Time
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--dd-text-muted)]" />
                    <Input
                      id="quiet-hours-start"
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => onPreferenceChange('quietHoursStart', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="quiet-hours-end"
                    className="text-sm font-medium text-[var(--dd-text-primary)] mb-2 block"
                  >
                    End Time
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--dd-text-muted)]" />
                    <Input
                      id="quiet-hours-end"
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => onPreferenceChange('quietHoursEnd', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--dd-text-muted)]">
                Notifications will be silenced from {preferences.quietHoursStart} to{' '}
                {preferences.quietHoursEnd}. Urgent delivery alerts may still come through.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export type { NotificationPreferencesProps };
