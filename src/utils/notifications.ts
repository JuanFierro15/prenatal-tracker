import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Cita } from '../types';

const KEY_KICK_ID      = '@kick_reminder_id';
const KEY_KICK_ENABLED = '@kick_reminder_enabled';
const KEY_KICK_HOUR    = '@kick_reminder_hour';
const KEY_KICK_MINUTE  = '@kick_reminder_minute';

export async function setupNotifications(): Promise<boolean> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bebe Totodrilo',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C2185B',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Citas ────────────────────────────────────────────────────────────────────

export async function scheduleAppointmentReminder(cita: Cita): Promise<string | null> {
  if (!cita.fecha || !cita.hora) return null;

  const citaDate = new Date(`${cita.fecha}T${cita.hora}:00`);
  const reminderDate = new Date(citaDate.getTime() - 60 * 60 * 1000); // 1 hora antes

  if (reminderDate <= new Date()) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏥 Cita médica en 1 hora',
        body: `${cita.especialidad} con ${cita.medico} a las ${cita.hora}`,
        sound: true,
        data: { citaId: cita.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelNotification(notifId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {}
}

// ── Recordatorio patadas ─────────────────────────────────────────────────────

export type KickReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export async function getKickReminderSettings(): Promise<KickReminderSettings> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(KEY_KICK_ENABLED),
    AsyncStorage.getItem(KEY_KICK_HOUR),
    AsyncStorage.getItem(KEY_KICK_MINUTE),
  ]);
  return {
    enabled: enabled === 'true',
    hour: hour !== null ? parseInt(hour) : 9,
    minute: minute !== null ? parseInt(minute) : 0,
  };
}

export async function scheduleKickReminder(hour: number, minute: number): Promise<void> {
  const prevId = await AsyncStorage.getItem(KEY_KICK_ID);
  if (prevId) await cancelNotification(prevId);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🦵 Hora de contar patadas',
        body: 'Recuerda registrar los movimientos del bebé hoy',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    await AsyncStorage.multiSet([
      [KEY_KICK_ID, id],
      [KEY_KICK_ENABLED, 'true'],
      [KEY_KICK_HOUR, String(hour)],
      [KEY_KICK_MINUTE, String(minute)],
    ]);
  } catch {}
}

export async function cancelKickReminder(): Promise<void> {
  const prevId = await AsyncStorage.getItem(KEY_KICK_ID);
  if (prevId) await cancelNotification(prevId);
  await AsyncStorage.multiSet([
    [KEY_KICK_ID, ''],
    [KEY_KICK_ENABLED, 'false'],
  ]);
}
