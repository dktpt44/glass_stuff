import * as React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Text,
  ImageBackground,
} from 'react-native';
import { RoundButton } from './components/RoundButton';
import { Theme } from './components/theme';
import useDevice from './modules/useDevice';
import DeviceModal from './components/DeviceConnectionModal';
import { DeviceView } from './DeviceView';

export const Main = React.memo(() => {
  const [device, setDevice] = React.useState(null);

  const {
    requestPermissions,
    scanForPeripherals,
    // allDevices,
    // connectToDevice,
    // connectedDevice,
    // heartRate,
    // disconnectFromDevice,
  } = useDevice();
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const scanForDevices = async () => {
    console.log("okiz");
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
      console.log("here");
    }
    console.log("doe");
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../assets/bg_ai.png')}
        resizeMode="cover"
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" hidden />
        {!device && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
            }}
          >
            <View
              style={{
                flex: 5,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  color: Theme.text,
                  fontSize: 26,
                  textAlign: 'center',
                  fontWeight: '800',
                }}
              >
                Welcome!
              </Text>
            </View>
            <View
              style={{
                flex: 6,
                justifyContent: 'flex-start',
                alignItems: 'center',
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  color: Theme.text,
                  fontSize: 16,
                  paddingLeft: 45,
                  paddingRight: 45,
                  marginBottom: 45,
                  textAlign: 'center',
                }}
              >
                Please make sure bluetooth is enabled and phone is connected to
                the camera device.
              </Text>
              <RoundButton
                title="Connect to the device"
                action={openModal}
              />
              <DeviceModal
                closeModal={hideModal}
                visible={isModalVisible}
                connectToPeripheral={() => {}}
                devices={[]}
              />
            </View>
          </View>
        )}
        {device && <DeviceView device={device} />}
      </ImageBackground>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
