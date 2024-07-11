import * as React from 'react';

import { useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';

import * as ExpoDevice from 'expo-device';

// import base64 from "react-native-base64";

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  // connectToDevice: (deviceId: Device) => Promise<void>;
  // disconnectFromDevice: () => void;
  // connectedDevice: Device | null;
  // allDevices: Device[];
  // heartRate: number;
}

export default function useDevice(): BluetoothLowEnergyApi {

//   const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);

  const scanForPeripherals = () => {

    console.log('Scanning for peripherals');
  };

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Bluetooth Low Energy requires Location',
        buttonPositive: 'OK',
      }
    );
    return (
      bluetoothScanPermission === 'granted' &&
      bluetoothConnectPermission === 'granted' &&
      fineLocationPermission === 'granted'
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy requires Location',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  // Create state
  //   let deviceRef = React.useRef<BluetoothRemoteGATTServer | null>(null);
  //   let [device, setDevice] = React.useState<BluetoothRemoteGATTServer | null>(
  //     null
  //   );
  //   // Create callback
  //   const doConnect = React.useCallback(async () => {
  //     try {
  //       // Connect to device
  //       let connected = await navigator.bluetooth.requestDevice({
  //         filters: [{ name: 'OpenGlass' }],
  //         optionalServices: [
  //           '19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase(),
  //         ],
  //       });
  //       // Connect to gatt
  //       let gatt: BluetoothRemoteGATTServer = await connected.gatt!.connect();
  //       deviceRef.current = gatt;
  //       setDevice(gatt);
  //     } catch (e) {
  //       // Handle error
  //       console.error(e);
  //     }
  //   }, [device]);
  //   // Return
  //   return [device, doConnect];
  return {
    scanForPeripherals,
    requestPermissions,
    // connectToDevice,
    // allDevices,
    // connectedDevice,
    // disconnectFromDevice,
    // heartRate,
  }
}
