import * as React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View, Switch } from 'react-native';
import { rotateImage } from './modules/imaging';
import { Agent } from './agent/Agent';
import { InvalidateSync } from './utils/invalidateSync';
// import { textToSpeech } from '../modules/openai';

function toBase64Image(src: Uint8Array) {
    const characters = Array.from(src, (byte) => String.fromCharCode(byte)).join('');
    return 'data:image/jpeg;base64,' + btoa(characters);
}

function usePhotos(device: any) {

    // Subscribe to device
    const [photos, setPhotos] = React.useState<Uint8Array[]>([]);
    const [subscribed, setSubscribed] = React.useState<boolean>(false);
    React.useEffect(() => {
        (async () => {

            let previousChunk = -1;
            let buffer: Uint8Array = new Uint8Array(0);
            function onChunk(id: number | null, data: Uint8Array) {

                // Resolve if packet is the first one
                if (previousChunk === -1) {
                    if (id === null) {
                        return;
                    } else if (id === 0) {
                        previousChunk = 0;
                        buffer = new Uint8Array(0);
                    } else {
                        return;
                    }
                } else {
                    if (id === null) {
                        console.log('Photo received', buffer);
                        rotateImage(buffer, '270').then((rotated) => {
                            console.log('Rotated photo', rotated);
                            setPhotos((p) => [...p, rotated]);
                        });
                        previousChunk = -1;
                        return;
                    } else {
                        if (id !== previousChunk + 1) {
                            previousChunk = -1;
                            console.error('Invalid chunk', id, previousChunk);
                            return;
                        }
                        previousChunk = id;
                    }
                }

                // Append data
                buffer = new Uint8Array([...buffer, ...data]);
            }

            // Subscribe for photo updates
            const service = await device.getPrimaryService('19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase());
            const photoCharacteristic = await service.getCharacteristic('19b10005-e8f2-537e-4f6c-d104768a1214');
            await photoCharacteristic.startNotifications();
            setSubscribed(true);
            photoCharacteristic.addEventListener('characteristicvaluechanged', (e :any) => {
                let value = (e.target as BluetoothRemoteGATTCharacteristic).value!;
                let array = new Uint8Array(value.buffer);
                if (array[0] == 0xff && array[1] == 0xff) {
                    onChunk(null, new Uint8Array());
                } else {
                    let packetId = array[0] + (array[1] << 8);
                    let packet = array.slice(2);
                    onChunk(packetId, packet);
                }
            });
        })();
    }, []);

    return [subscribed, photos] as const;
}

export const DeviceView = React.memo((props: { device: any }) => {
    // const [subscribed, photos] = usePhotos(props.device);
    const agent = React.useMemo(() => new Agent(), []);
    const agentState = agent.use();

    const [userPrompt, setUserPrompt] = React.useState<string>("To begin capturing pictures, please ask a question to the assistant.");
    const [assistantResponse, setAssistantResponse] = React.useState<string | null>(null);

    const [voiceInputSwitch, setVoiceInputSwitch] = React.useState<boolean>(true);

    // Background processing agent
    const processedPhotos = React.useRef<Uint8Array[]>([]);
    const sync = React.useMemo(() => {
        let processed = 0;
        return new InvalidateSync(async () => {
            if (processedPhotos.current.length > processed) {
                let unprocessed = processedPhotos.current.slice(processed);
                processed = processedPhotos.current.length;
                await agent.addPhoto(unprocessed);
            }
        });
    }, []);

    // React.useEffect(() => {
    //     processedPhotos.current = photos;
    //     sync.invalidate();
    // }, [photos]);

    
    const photos: string[] = [];

    return (
        <View style={{ flex: 1}}>

            <ScrollView style={{ padding: 10 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>

                    <Image source={require('../assets/usr.png')} style={{width:35, height:35,  }}/>

                
                    <Text style={{ flex: 1, color: 'white', fontSize: 16, textAlign: 'left', padding: 0, verticalAlign:'middle' }}>{userPrompt}</Text>
                </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10, paddingLeft: 42 }}>
                        {photos.map((photo, index) => (
                            <Image key={index} style={{ width: 120, height: 120, borderRadius: 5, borderWidth: 1, borderColor: "darkgreen" }} source={{ uri: photo }} />
                        ))}
                    </View>
            </ScrollView>


            {/* input content  */}

            <View style={{ width: "100%", padding:20, position: 'absolute', bottom: 0 }}>

                <View style={{ backgroundColor: 'rgb(28 28 28)', width: "100%", borderRadius: 5, flexDirection: 'column', paddingLeft: 8, paddingRight: 8}}>


                    {/* for switch  */}

                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 5}}>
                        <Text style={{ color: 'white', fontSize: 16 }}>Voice Input</Text>
                        <Switch value={voiceInputSwitch} onValueChange={()=> setVoiceInputSwitch(!voiceInputSwitch)}/>
                    </View>


                    <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8  }}>
                        {agentState.loading && (<ActivityIndicator size="large" color={"white"} />)}
                        {agentState.answer && !agentState.loading && (<ScrollView style={{ flexGrow: 1, flexBasis: 0 }}><Text style={{ color: 'white', fontSize: 16 }}>{agentState.answer}</Text></ScrollView>)}
                    </View>

                    {}

                    {!voiceInputSwitch && <TextInput
                        style={{ color: 'white', fontSize: 16, borderRadius: 4, backgroundColor: 'rgb(48 48 48)', padding: 4, marginBottom: 14 }}
                        placeholder='Enter your prompt'
                        placeholderTextColor={'#888'}
                        readOnly={agentState.loading}
                        onSubmitEditing={(e) => agent.answer(e.nativeEvent.text)}
                    />}
                </View>
            </View>
        </View>
    );
});







// export function useDevice(): [BleManager | null, () => Promise<void>] {

//     // Create state
//     let deviceRef = React.useRef<BleManager | null>(null);
//     let [device, setDevice] = React.useState<BleManager | null>(null);

//     // Create callback
//     const doConnect = React.useCallback(async () => {
//         try {

//             // Initialize BleManager
//             const manager = new BleManager();

//             // Connect to device
//             let connected = await manager.startDeviceScan(null, null, (error, scannedDevice) => {
//                 if (scannedDevice?.name === 'OpenGlass') {
//                     manager.stopDeviceScan();
//                     scannedDevice?.connect()
//                         .then((device) => {
//                             deviceRef.current = device;
//                             setDevice(device);
//                         })
//                         .catch((error) => {
//                             console.error(error);
//                         });
//                 }
//             });

//         } catch (e) {
//             console.error(e);
//         }
//     }, [device]);

//     // Return
//     return [device, doConnect];
// }
