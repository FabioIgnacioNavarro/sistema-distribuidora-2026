import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppVendedorDiseñada } from './src/pantallas/vendedor/app-vendedor-disenada';

export default function App(): React.JSX.Element {
  return <SafeAreaProvider><AppVendedorDiseñada /></SafeAreaProvider>;
}
