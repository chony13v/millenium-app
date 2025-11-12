import * as Location from "expo-location";

const LEGACY_TASK_NAMES = ["bg-location-weekly"] as const;

/**
 * Detiene silenciosamente las tareas de ubicación en background definidas en
 * versiones anteriores de la app. Es seguro ejecutarlo incluso si la tarea no
 * existe o nunca se inició.
 */
export const stopLegacyLocationTasks = async (): Promise<void> => {
  for (const taskName of LEGACY_TASK_NAMES) {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(taskName);

      if (!hasStarted) {
        continue;
      }

      await Location.stopLocationUpdatesAsync(taskName);
      console.log(`Detenida tarea de ubicación heredada: ${taskName}`);
    } catch (error) {
      console.warn(`No se pudo detener la tarea heredada ${taskName}`, error);
    }
  }
};

export default stopLegacyLocationTasks;