import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ProductoVendedor {
  id: string;
  nombre: string;
  precio: number;
}

const PRODUCTOS: ProductoVendedor[] = [
  { id: 'ALI-059', nombre: 'Aceite Cocinero 900cc', precio: 3190 },
  { id: 'BEB-V013', nombre: 'Alaris Cab. Sauvignon', precio: 4100 },
  { id: 'SNK-003', nombre: 'Crutons Minitostaditas Queso', precio: 1800 },
];

const formatearDinero = (valor: number): string => `$${valor.toLocaleString('es-AR')}`;

export function PedidoVendedor(): React.JSX.Element {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [mostrarRemito, setMostrarRemito] = useState(false);
  const total = useMemo(
    () => PRODUCTOS.reduce((suma, producto) => suma + producto.precio * (cantidades[producto.id] ?? 0), 0),
    [cantidades],
  );

  const cambiarCantidad = (productoId: string, cambio: number): void => {
    setCantidades((actuales) => {
      const cantidad = Math.max(0, (actuales[productoId] ?? 0) + cambio);
      return { ...actuales, [productoId]: cantidad };
    });
  };

  return (
    <SafeAreaView style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.marca}>FONTANA · VENDEDOR</Text>
        <Text style={estilos.titulo}>{mostrarRemito ? 'Previsualización del remito' : 'Nuevo pedido'}</Text>
        <Text style={estilos.cliente}>Cliente: Tickets bajos</Text>
        {mostrarRemito ? (
          <View style={estilos.remito}>
            <Text style={estilos.remitoTitulo}>FONTANA DISTRIBUCIONES</Text>
            {PRODUCTOS.filter((producto) => (cantidades[producto.id] ?? 0) > 0).map((producto) => (
              <View key={producto.id} style={estilos.linea}>
                <Text style={estilos.producto}>{producto.nombre}{'\n'}<Text style={estilos.secundario}>{cantidades[producto.id]} × {formatearDinero(producto.precio)}</Text></Text>
                <Text style={estilos.precio}>{formatearDinero(producto.precio * cantidades[producto.id])}</Text>
              </View>
            ))}
            <View style={estilos.total}><Text style={estilos.producto}>TOTAL PEDIDO</Text><Text style={estilos.producto}>{formatearDinero(total)}</Text></View>
            <Pressable style={estilos.boton} onPress={() => { setCantidades({}); setMostrarRemito(false); }}><Text style={estilos.botonTexto}>Confirmar pedido</Text></Pressable>
            <Pressable style={estilos.botonSecundario} onPress={() => setMostrarRemito(false)}><Text style={estilos.botonSecundarioTexto}>Editar pedido</Text></Pressable>
          </View>
        ) : (
          <>
            {PRODUCTOS.map((producto) => (
              <View key={producto.id} style={estilos.tarjeta}>
                <View><Text style={estilos.producto}>{producto.nombre}</Text><Text style={estilos.secundario}>{producto.id} · {formatearDinero(producto.precio)}</Text></View>
                <View style={estilos.controles}><Pressable onPress={() => cambiarCantidad(producto.id, -1)} style={estilos.control}><Text>−</Text></Pressable><Text>{cantidades[producto.id] ?? 0}</Text><Pressable onPress={() => cambiarCantidad(producto.id, 1)} style={estilos.control}><Text>+</Text></Pressable></View>
              </View>
            ))}
            <Pressable disabled={total === 0} style={[estilos.boton, total === 0 && estilos.botonDeshabilitado]} onPress={() => setMostrarRemito(true)}><Text style={estilos.botonTexto}>Revisar remito · {formatearDinero(total)}</Text></Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#fbfcfa' },
  contenido: { padding: 22, gap: 14 },
  marca: { color: '#1c6b43', fontWeight: '800', letterSpacing: 1.4 },
  titulo: { color: '#17221c', fontSize: 28, fontWeight: '800', marginTop: 8 },
  cliente: { color: '#718077', marginBottom: 8 },
  tarjeta: { backgroundColor: '#fff', borderColor: '#e4ebe5', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  producto: { color: '#17221c', fontWeight: '700' },
  secundario: { color: '#718077', fontSize: 12, marginTop: 4 },
  precio: { color: '#17221c', fontWeight: '700' },
  controles: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  control: { alignItems: 'center', backgroundColor: '#e7f1e8', borderRadius: 16, height: 30, justifyContent: 'center', width: 30 },
  remito: { backgroundColor: '#fff', borderColor: '#e1e8e1', borderRadius: 14, borderWidth: 1, padding: 16 },
  remitoTitulo: { color: '#1c6b43', fontWeight: '800', marginBottom: 12 },
  linea: { borderBottomColor: '#eef2ee', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  total: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18 },
  boton: { alignItems: 'center', backgroundColor: '#1c6b43', borderRadius: 12, marginTop: 8, padding: 15 },
  botonDeshabilitado: { opacity: 0.4 },
  botonTexto: { color: '#fff', fontWeight: '800' },
  botonSecundario: { alignItems: 'center', borderColor: '#cdd9ce', borderRadius: 12, borderWidth: 1, marginTop: 8, padding: 14 },
  botonSecundarioTexto: { color: '#1c6b43', fontWeight: '700' },
});
