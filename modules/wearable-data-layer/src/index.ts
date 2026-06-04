import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to WearableDataLayer.web.ts
// and on native platforms to WearableDataLayerModule.ts
const WearableDataLayerModule = NativeModulesProxy.WearableDataLayer || {
  sendEntryTime: async () => {},
  isAvailable: async () => false,
};

export async function sendEntryTime(time: string): Promise<boolean> {
  return await WearableDataLayerModule.sendEntryTime(time);
}

export async function isAvailable(): Promise<boolean> {
  return await WearableDataLayerModule.isAvailable();
}








