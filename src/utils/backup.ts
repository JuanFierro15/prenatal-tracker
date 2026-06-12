import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const BACKUP_VERSION = '1';
const APP_ID = 'Bebe Totodrilo';

export type BackupResult = { ok: boolean; mensaje: string };

export async function exportarBackup(): Promise<BackupResult> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys as string[]);

    const datos: Record<string, string> = {};
    for (const [key, value] of pairs) {
      if (value !== null) datos[key] = value;
    }

    const backup = {
      version: BACKUP_VERSION,
      app: APP_ID,
      fecha: new Date().toISOString(),
      datos,
    };

    const fechaStr = new Date().toISOString().split('T')[0];
    const filename = `bebe-totodrilo-backup-${fechaStr}.json`;
    const uri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const puedeCompartir = await Sharing.isAvailableAsync();
    if (!puedeCompartir) {
      return { ok: false, mensaje: 'Tu dispositivo no soporta compartir archivos.' };
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar backup de Bebe Totodrilo',
      UTI: 'public.json',
    });

    return { ok: true, mensaje: `Backup creado: ${filename}` };
  } catch (e) {
    console.error('[Backup] Export error:', e);
    return { ok: false, mensaje: 'Error al crear el backup.' };
  }
}

export async function importarBackup(): Promise<BackupResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { ok: false, mensaje: 'Cancelado.' };

    const uri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    let backup: any;
    try {
      backup = JSON.parse(content);
    } catch {
      return { ok: false, mensaje: 'El archivo no es un JSON válido.' };
    }

    if (backup.app !== APP_ID || !backup.datos || typeof backup.datos !== 'object') {
      return { ok: false, mensaje: 'El archivo no corresponde a un backup de esta app.' };
    }

    const pairs: [string, string][] = Object.entries(backup.datos as Record<string, string>);
    await AsyncStorage.multiSet(pairs);

    const fecha = backup.fecha ? backup.fecha.split('T')[0] : 'fecha desconocida';
    return { ok: true, mensaje: `Datos del ${fecha} restaurados. Cierra y vuelve a abrir la app para ver los cambios.` };
  } catch (e) {
    console.error('[Backup] Import error:', e);
    return { ok: false, mensaje: 'Error al importar el backup.' };
  }
}
