import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification handling (only on native platforms)
if (Device.osName) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice || !Device.osName) {
    console.log('Must use physical device for push notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token permission');
      return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.log('Project ID not found');
      return null;
    }

    const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', pushToken);
    return pushToken;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function schedulePomodoroNotification(
  title: string,
  body: string,
  seconds: number
) {
  try {
    if (!Device.osName) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'pomodoro' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      } as Notifications.TimeIntervalTriggerInput,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelScheduledNotifications() {
  try {
    if (!Device.osName) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

export async function sendImmediateNotification(title: string, body: string) {
  try {
    if (!Device.osName) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { type: 'pomodoro' },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
}