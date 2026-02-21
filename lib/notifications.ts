import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping permissions');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    console.log('[Notifications] Permission granted');
    return true;
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

export async function scheduleFollowUpNotification(params: {
  leadId: string;
  clientName: string;
  followUpDateTime: Date;
  notes?: string;
}): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping schedule');
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[Notifications] No permission to schedule');
      return null;
    }

    const triggerDate = new Date(params.followUpDateTime);
    const now = new Date();

    if (triggerDate <= now) {
      console.log('[Notifications] Follow-up date is in the past, skipping');
      return null;
    }

    const secondsUntilTrigger = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Follow-up: ${params.clientName}`,
        body: params.notes
          ? `Scheduled follow-up with ${params.clientName}. Notes: ${params.notes}`
          : `You have a scheduled follow-up with ${params.clientName}`,
        data: { leadId: params.leadId, type: 'follow_up' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
        repeats: false,
      },
    });

    console.log(`[Notifications] Scheduled notification ${notificationId} for ${params.clientName} in ${secondsUntilTrigger}s`);

    const reminderSeconds = secondsUntilTrigger - 3600;
    if (reminderSeconds > 60) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: Follow-up in 1 hour`,
          body: `Upcoming follow-up with ${params.clientName}`,
          data: { leadId: params.leadId, type: 'follow_up_reminder' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: reminderSeconds,
          repeats: false,
        },
      });
      console.log(`[Notifications] Scheduled 1-hour reminder for ${params.clientName}`);
    }

    return notificationId;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All scheduled notifications cancelled');
  } catch (error) {
    console.error('[Notifications] Error cancelling notifications:', error);
  }
}

export async function getScheduledNotifications() {
  if (Platform.OS === 'web') return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Error getting scheduled notifications:', error);
    return [];
  }
}
