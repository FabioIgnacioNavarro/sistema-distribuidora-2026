import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

type Vista =
  | "inicio"
  | "pedido"
  | "precios"
  | "historial"
  | "remito"
  | "confirmado";
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
}
interface Cliente {
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
}
const productos: Producto[] = [
  {
    id: "ALI-059",
    nombre: "Aceite Cocinero 900cc",
    categoria: "Almacén",
    precio: 3190,
  },
  {
    id: "BEB-V013",
    nombre: "Alaris Cab. Sauvignon",
    categoria: "Bebidas",
    precio: 4100,
  },
  {
    id: "SNK-003",
    nombre: "Crutons Minitostaditas Queso",
    categoria: "Snacks",
    precio: 1800,
  },
  {
    id: "ALI-045.1",
    nombre: "Fideo Santa Isabel 500g Coditos",
    categoria: "Almacén",
    precio: 600,
  },
];
const clientesIniciales: Cliente[] = [
  {
    codigo: "CL-0000",
    nombre: "Tickets bajos",
    direccion: "NNN",
    telefono: "Sin teléfono",
  },
  {
    codigo: "CL-0001",
    nombre: "Avicola 912",
    direccion: "La Pampa 1048",
    telefono: "362 455 9207",
  },
  {
    codigo: "CL-0002",
    nombre: "Kiosco Gema (Tati)",
    direccion: "Puerto de Palos 23",
    telefono: "362 428 5102",
  },
];
const dinero = (valor: number): string => `$${valor.toLocaleString("es-AR")}`;
const etiquetaCondicion = (valor: string): string =>
  ({
    cuenta_corriente_7: "Cuenta corriente · 7 días",
    cuenta_corriente_14: "Cuenta corriente · 14 días",
    cuenta_corriente_30: "Cuenta corriente · 30 días",
    transferencia: "Transferencia",
    contado: "Contado",
    tarjeta: "Tarjeta",
  })[valor] ?? valor;

export function AppVendedorDiseñada(): React.JSX.Element {
  const [autenticado, setAutenticado] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>("inicio");
  const [oscuro, setOscuro] = useState(false);
  const [clientes, setClientes] = useState(clientesIniciales);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [condicionPago, setCondicionPago] = useState("cuenta_corriente_7");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalRemito, setModalRemito] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const tema = oscuro ? colores.oscuro : colores.claro;
  const categorias = [
    "Todas",
    ...new Set(productos.map((producto) => producto.categoria)),
  ];
  const total = useMemo(
    () =>
      productos.reduce(
        (suma, producto) =>
          suma + producto.precio * (cantidades[producto.id] ?? 0),
        0,
      ),
    [cantidades],
  );
  const clientesFiltrados = clientes.filter((item) =>
    `${item.nombre} ${item.codigo}`
      .toLowerCase()
      .includes(busquedaCliente.toLowerCase()),
  );
  const productosFiltrados = productos.filter(
    (item) =>
      item.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      (categoria === "Todas" || item.categoria === categoria),
  );
  useEffect(() => {
    if (Platform.OS === "android")
      void NavigationBar.setVisibilityAsync("hidden");
    return () => {
      if (Platform.OS === "android")
        void NavigationBar.setVisibilityAsync("visible");
    };
  }, []);
  const cambiarCantidad = (id: string, cambio: number): void =>
    setCantidades((actuales) => ({
      ...actuales,
      [id]: Math.max(0, (actuales[id] ?? 0) + cambio),
    }));
  const opacidad = React.useRef(new Animated.Value(1)).current;
  const desplazamiento = React.useRef(new Animated.Value(0)).current;
  const escalaTema = React.useRef(new Animated.Value(1)).current;
  const cambiarTema = (nuevoModoOscuro: boolean): void => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(escalaTema, {
          toValue: 0.72,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(opacidad, {
          toValue: 0.55,
          duration: 130,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(escalaTema, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 7,
        }),
        Animated.timing(opacidad, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setOscuro(nuevoModoOscuro);
  };
  const seleccionarVista = (nueva: Vista): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    opacidad.setValue(0);
    desplazamiento.setValue(10);
    setVista(nueva);
    setDetalleAbierto(null);
    Animated.parallel([
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(desplazamiento, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const guardarCliente = (): void => {
    if (!nuevoNombre.trim()) return;
    const siguienteCodigo =
      clientes.reduce((mayor, item) => {
        const numero = Number(item.codigo.match(/^CL-(\d{4})$/)?.[1] ?? 0);
        return Math.max(mayor, numero);
      }, 0) + 1;
    const nuevo: Cliente = {
      codigo: `CL-${String(siguienteCodigo).padStart(4, "0")}`,
      nombre: nuevoNombre.trim(),
      direccion: nuevaDireccion.trim() || "Sin dirección",
      telefono: nuevoTelefono.trim() || "Sin teléfono",
    };
    setClientes([...clientes, nuevo]);
    setCliente(nuevo);
    setNuevoNombre("");
    setNuevaDireccion("");
    setNuevoTelefono("");
    setModalCliente(false);
    seleccionarVista("pedido");
  };
  const selectorCategorias = (
    <Picker
      selectedValue={categoria}
      onValueChange={(valor) => setCategoria(valor)}
      style={[estilos.picker, tema.texto]}
      dropdownIconColor={tema.texto.color}
    >
      <Picker.Item label="Todas las categorías" value="Todas" />
      {categorias
        .filter((item) => item !== "Todas")
        .map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
    </Picker>
  );

  if (!autenticado)
    return (
      <SafeAreaView style={[estilos.pantalla, tema.fondo]}>
        <StatusBar hidden />
        <View style={[estilos.acceso, tema.superficie]}>
          <Text style={estilos.marca}>FONTANA DISTRIBUCIONES</Text>
          <Text style={[estilos.titulo, tema.texto]}>Ingresar a la app</Text>
          <Text style={tema.secundario}>Código de vendedor o chofer</Text>
          <TextInput
            secureTextEntry
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Código de acceso"
            placeholderTextColor={tema.secundario.color}
            style={[estilos.input, tema.input]}
          />
          <Pressable
            style={estilos.boton}
            onPress={() => {
              const valido = codigo === "pass1234";
              setError(!valido);
              if (valido) setAutenticado(true);
            }}
          >
            <Text style={estilos.botonTexto}>Ingresar</Text>
          </Pressable>
          {error && (
            <Text style={estilos.error}>
              Código incorrecto. Probá con pass1234.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView
      style={[estilos.pantalla, tema.fondo]}
      edges={["top", "bottom"]}
    >
      <StatusBar hidden />
      <Animated.ScrollView
        style={{ opacity: opacidad }}
        contentContainerStyle={estilos.contenido}
      >
        <View style={estilos.encabezado}>
          <View>
            <Text style={estilos.marca}>FONTANA DISTRIBUCIONES</Text>
            <Text style={tema.secundario}>Vendedor · Martín</Text>
          </View>
          <Animated.View
            style={[
              estilos.temas,
              {
                width: 42,
                height: 42,
                marginLeft: "auto",
                alignSelf: "flex-start",
                flexShrink: 0,
                transform: [{ scale: escalaTema }],
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Cambiar modo claro u oscuro"
              onPress={() => cambiarTema(!oscuro)}
              style={{
                flex: 1,
                width: 42,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: oscuro ? "#176b43" : "#dce7de",
              }}
            >
              <Text
                style={{
                  color: oscuro ? "#fff" : "#176b43",
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                {oscuro ? "◐" : "☼"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
        {vista === "inicio" && (
          <>
            <Text style={[estilos.titulo, tema.texto]}>¿Qué hacemos hoy?</Text>
            <Pressable
              style={estilos.boton}
              onPress={() => seleccionarVista("pedido")}
            >
              <Text style={estilos.botonTexto}>＋ Nuevo pedido</Text>
            </Pressable>
            <Pressable
              style={[estilos.botonSecundario, tema.superficie]}
              onPress={() => seleccionarVista("precios")}
            >
              <Text style={tema.enlace}>$ Lista de precios</Text>
            </Pressable>
            <Text style={[estilos.subtitulo, tema.texto]}>
              Resumen de rentabilidad
            </Text>
            <View style={[estilos.resumen, tema.superficie]}>
              <Resumen numero="4" etiqueta="Pedidos del día" tema={tema} />
              <Resumen numero="12" etiqueta="Pedidos del mes" tema={tema} />
              <Resumen
                numero="$184.600"
                etiqueta="Ganancia total"
                tema={tema}
              />
            </View>
          </>
        )}
        {vista === "precios" && (
          <>
            <EncabezadoVista
              titulo="Lista de precios"
              volver={() => seleccionarVista("inicio")}
              tema={tema}
            />
            <TextInput
              value={busquedaProducto}
              onChangeText={setBusquedaProducto}
              placeholder="Buscar por nombre"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            {selectorCategorias}
            {productosFiltrados.map((producto) => (
              <ProductoPrecio
                key={producto.id}
                producto={producto}
                tema={tema}
              />
            ))}
          </>
        )}
        {vista === "pedido" && (
          <>
            <EncabezadoVista
              titulo="Nuevo pedido"
              volver={() => seleccionarVista("inicio")}
              tema={tema}
            />
            <Text
              style={[
                { fontSize: 15, fontWeight: "800", marginBottom: 6 },
                tema.texto,
              ]}
            >
              Cliente
            </Text>
            <TextInput
              value={busquedaCliente}
              onChangeText={setBusquedaCliente}
              placeholder="Buscar cliente por nombre o código"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            <View
              style={[
                {
                  borderWidth: 1,
                  borderRadius: 11,
                  overflow: "hidden",
                  marginBottom: 8,
                },
                tema.superficie,
              ]}
            >
              <Picker
                selectedValue={cliente?.codigo ?? ""}
                onValueChange={(valor) =>
                  setCliente(
                    clientes.find((item) => item.codigo === valor) ?? null,
                  )
                }
                dropdownIconColor={tema.texto.color}
                style={{ color: tema.texto.color }}
              >
                <Picker.Item
                  label={
                    clientesFiltrados.length
                      ? "Seleccionar cliente..."
                      : "Sin coincidencias"
                  }
                  value=""
                />
                {clientesFiltrados.map((item) => (
                  <Picker.Item
                    key={item.codigo}
                    label={`${item.nombre} · ${item.codigo}`}
                    value={item.codigo}
                  />
                ))}
              </Picker>
            </View>
            <Pressable onPress={() => setModalCliente(true)}>
              <Text style={tema.enlace}>＋ Añadir cliente</Text>
            </Pressable>
            {cliente && (
              <View
                style={[
                  {
                    borderWidth: 1,
                    borderRadius: 13,
                    padding: 14,
                    gap: 5,
                    marginTop: 10,
                    marginBottom: 12,
                  },
                  tema.superficie,
                ]}
              >
                <Text style={[estilos.producto, tema.texto]}>
                  Datos del cliente
                </Text>
                <Text style={tema.secundario}>Código: {cliente.codigo}</Text>
                <Text style={tema.secundario}>
                  Nombre comercial: {cliente.nombre}
                </Text>
                <Text style={tema.secundario}>
                  Dirección: {cliente.direccion}
                </Text>
                <Text style={tema.secundario}>
                  Teléfono: {cliente.telefono}
                </Text>
              </View>
            )}
            <Text
              style={[
                { fontSize: 15, fontWeight: "800", marginBottom: 6 },
                tema.texto,
              ]}
            >
              Condición de pago
            </Text>
            <View
              style={[
                {
                  borderWidth: 1,
                  borderRadius: 11,
                  overflow: "hidden",
                  marginBottom: 10,
                },
                tema.superficie,
              ]}
            >
              <Picker
                selectedValue={condicionPago}
                onValueChange={(valor) => setCondicionPago(valor)}
                dropdownIconColor={tema.texto.color}
                style={{ color: tema.texto.color }}
              >
                <Picker.Item
                  label="Cuenta corriente · 7 días"
                  value="cuenta_corriente_7"
                />
                <Picker.Item
                  label="Cuenta corriente · 14 días"
                  value="cuenta_corriente_14"
                />
                <Picker.Item
                  label="Cuenta corriente · 30 días"
                  value="cuenta_corriente_30"
                />
                <Picker.Item label="Transferencia" value="transferencia" />
                <Picker.Item label="Contado" value="contado" />
                <Picker.Item label="Tarjeta" value="tarjeta" />
              </Picker>
            </View>
            <TextInput
              value={busquedaProducto}
              onChangeText={setBusquedaProducto}
              placeholder="Buscar producto por nombre"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            {selectorCategorias}
            {productosFiltrados.map((producto) => (
              <View
                key={producto.id}
                style={[estilos.productoFila, tema.superficie]}
              >
                <View style={estilos.flexible}>
                  <Text style={[estilos.producto, tema.texto]}>
                    {producto.nombre}
                  </Text>
                  <Text style={tema.secundario}>
                    {producto.categoria} · {dinero(producto.precio)}
                  </Text>
                </View>
                <View style={estilos.controles}>
                  <Pressable
                    style={estilos.controlGrande}
                    onPress={() => cambiarCantidad(producto.id, -1)}
                  >
                    <Text style={estilos.controlTexto}>−</Text>
                  </Pressable>
                  <Text style={[estilos.cantidad, tema.texto]}>
                    {cantidades[producto.id] ?? 0}
                  </Text>
                  <Pressable
                    style={estilos.controlGrande}
                    onPress={() => cambiarCantidad(producto.id, 1)}
                  >
                    <Text style={estilos.controlTexto}>＋</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable
              disabled={!cliente || total === 0}
              style={[
                estilos.boton,
                (!cliente || total === 0) && estilos.deshabilitado,
              ]}
              onPress={() => seleccionarVista("remito")}
            >
              <Text style={estilos.botonTexto}>
                Revisar remito · {dinero(total)}
              </Text>
            </Pressable>
          </>
        )}
        {vista === "remito" && (
          <>
            <EncabezadoVista
              titulo="Previsualización del remito"
              volver={() => seleccionarVista("pedido")}
              tema={tema}
            />
            <View style={[estilos.remito, tema.superficie]}>
              <View style={estilos.remitoCabecera}>
                <View>
                  <Text style={estilos.marca}>FONTANA DISTRIBUCIONES</Text>
                  <Text style={tema.secundario}>
                    Bebidas, snacks y alimentos
                  </Text>
                </View>
                <Text style={estilos.etiqueta}>PREVISUALIZACIÓN</Text>
              </View>
              <Text style={tema.texto}>Cliente: {cliente?.nombre}</Text>
              <Text style={tema.secundario}>
                Condición de pago: {etiquetaCondicion(condicionPago)}
              </Text>
              {productos
                .filter((producto) => (cantidades[producto.id] ?? 0) > 0)
                .map((producto) => (
                  <View key={producto.id} style={estilos.lineaRemito}>
                    <View style={estilos.flexible}>
                      <Text style={[estilos.producto, tema.texto]}>
                        {producto.nombre}
                      </Text>
                      <Text style={tema.secundario}>
                        {cantidades[producto.id]} × {dinero(producto.precio)}
                      </Text>
                    </View>
                    <Text style={[estilos.producto, tema.texto]}>
                      {dinero(producto.precio * cantidades[producto.id])}
                    </Text>
                  </View>
                ))}
              <View style={estilos.total}>
                <Text style={[estilos.producto, tema.texto]}>TOTAL PEDIDO</Text>
                <Text style={[estilos.producto, tema.texto]}>
                  {dinero(total)}
                </Text>
              </View>
            </View>
            <Pressable
              style={estilos.botonSecundario}
              onPress={() => setModalRemito(true)}
            >
              <Text style={tema.enlace}>Ver formato de impresión</Text>
            </Pressable>
            <Pressable
              style={estilos.boton}
              onPress={() => {
                setCantidades({});
                setCliente(null);
                setModalRemito(false);
                seleccionarVista("confirmado");
              }}
            >
              <Text style={estilos.botonTexto}>Confirmar pedido</Text>
            </Pressable>
          </>
        )}
        {vista === "confirmado" && (
          <View style={estilos.confirmacion}>
            <View style={estilos.check}>
              <Text style={estilos.checkTexto}>✓</Text>
            </View>
            <Text style={[estilos.titulo, tema.texto]}>Pedido enviado</Text>
            <Text style={[estilos.confirmacionTexto, tema.secundario]}>
              El pedido quedó registrado y será preparado por el equipo.
            </Text>
            <Pressable
              style={estilos.boton}
              onPress={() => seleccionarVista("inicio")}
            >
              <Text style={estilos.botonTexto}>Volver al inicio</Text>
            </Pressable>
          </View>
        )}
        {vista === "historial" && (
          <>
            <EncabezadoVista
              titulo="Historial de pedidos"
              volver={() => seleccionarVista("inicio")}
              tema={tema}
            />
            {[
              {
                texto: "#10001 · Avicola 912 · $15.400",
                porcentaje: "10%",
                ganancia: "$1.538",
              },
              {
                texto: "#10000 · Tickets bajos · $48.600",
                porcentaje: "10%",
                ganancia: "$4.860",
              },
            ].map((pedido) => (
              <Pressable
                key={pedido.texto}
                style={[estilos.historial, tema.superficie]}
                onPress={() =>
                  setDetalleAbierto(
                    detalleAbierto === pedido.texto ? null : pedido.texto,
                  )
                }
              >
                <View style={estilos.historialCabecera}>
                  <Text
                    style={[estilos.producto, tema.texto, estilos.flexible]}
                    numberOfLines={2}
                  >
                    {pedido.texto}
                  </Text>
                  <Text style={tema.enlace}>
                    {detalleAbierto === pedido.texto ? "Cerrar" : "Detalle"}
                  </Text>
                </View>
                {detalleAbierto === pedido.texto && (
                  <View style={estilos.detalle}>
                    <Text style={tema.secundario}>
                      2 × Aceite Cocinero 900cc · $6.380
                    </Text>
                    <Text style={tema.secundario}>
                      5 × Crutons Minitostaditas · $9.000
                    </Text>
                    <Text style={[estilos.producto, tema.texto]}>
                      Total vendido: $15.400
                    </Text>
                    <Text style={[estilos.producto, tema.texto]}>
                      Comisión: {pedido.porcentaje}
                    </Text>
                    <Text style={[estilos.producto, tema.enlace]}>
                      Ganancia del pedido: {pedido.ganancia}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </>
        )}
      </Animated.ScrollView>
      <Modal
        visible={modalCliente}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCliente(false)}
      >
        <View style={estilosModal.modalFondo}>
          <View style={[estilosModal.modalTarjeta, tema.superficie]}>
            <Text style={[estilos.subtitulo, tema.texto]}>Nuevo cliente</Text>
            <TextInput
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Nombre comercial"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            <TextInput
              value={nuevaDireccion}
              onChangeText={setNuevaDireccion}
              placeholder="Dirección"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            <TextInput
              value={nuevoTelefono}
              onChangeText={setNuevoTelefono}
              placeholder="Teléfono"
              placeholderTextColor={tema.secundario.color}
              style={[estilos.input, tema.input]}
            />
            <Pressable style={estilos.boton} onPress={guardarCliente}>
              <Text style={estilos.botonTexto}>Guardar cliente</Text>
            </Pressable>
            <Pressable onPress={() => setModalCliente(false)}>
              <Text style={tema.enlace}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={modalRemito}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRemito(false)}
      >
        <View
          style={[
            estilosModal.modalFondo,
            { justifyContent: "center", padding: 10 },
          ]}
        >
          <View
            style={[
              estilosModal.modalTarjeta,
              {
                width: "100%",
                maxHeight: "92%",
                borderRadius: 16,
                padding: 14,
              },
              tema.superficie,
            ]}
          >
            <ScrollView showsVerticalScrollIndicator>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#9aa79d",
                  backgroundColor: oscuro ? "#18231d" : "#fff",
                }}
              >
                <View
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#9aa79d",
                  }}
                >
                  <Text style={[estilos.marca, { fontSize: 16 }]}>
                    FONTANA DISTRIBUCIONES
                  </Text>
                  <Text style={tema.secundario}>
                    BEBIDAS, SNACKS Y ALIMENTOS
                  </Text>
                  <Text style={tema.secundario}>
                    Fontana - Chaco - Argentina
                  </Text>
                  <Text
                    style={[{ marginTop: 10, fontWeight: "800" }, tema.texto]}
                  >
                    PRESUPUESTO N° 0002160
                  </Text>
                  <Text style={tema.secundario}>
                    Fecha de emisión: {new Date().toLocaleDateString("es-AR")}
                  </Text>
                  <Text style={tema.secundario}>Teléfono: 362 475 7093</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontWeight: "800" }, tema.texto]}>
                        Señor(es): {cliente?.nombre ?? "Sin cliente"}
                      </Text>
                      <Text style={tema.secundario}>
                        Código: {cliente?.codigo ?? "—"}
                      </Text>
                      <Text style={tema.secundario}>
                        Dirección: {cliente?.direccion ?? "Sin dirección"}
                      </Text>
                    </View>
                    <View style={{ flex: 0.8 }}>
                      <Text style={[{ fontWeight: "800" }, tema.texto]}>
                        Condición:
                      </Text>
                      <Text style={tema.secundario}>{etiquetaCondicion(condicionPago)}</Text>
                    </View>
                  </View>
                  <Text style={tema.secundario}>
                    Contacto: {cliente?.telefono ?? "Sin teléfono"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: oscuro ? "#254435" : "#e7efe9",
                    borderBottomWidth: 1,
                    borderBottomColor: "#9aa79d",
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      flex: 0.9,
                      paddingHorizontal: 5,
                      fontSize: 10,
                      fontWeight: "900",
                      color: tema.texto.color,
                    }}
                  >
                    Código Art.
                  </Text>
                  <Text
                    style={{
                      flex: 1.6,
                      paddingHorizontal: 5,
                      fontSize: 10,
                      fontWeight: "900",
                      color: tema.texto.color,
                    }}
                  >
                    Descripción del producto
                  </Text>
                  <Text
                    style={{
                      flex: 0.55,
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: "900",
                      color: tema.texto.color,
                    }}
                  >
                    Cantidad
                  </Text>
                  <Text
                    style={{
                      flex: 0.8,
                      textAlign: "right",
                      fontSize: 10,
                      fontWeight: "900",
                      color: tema.texto.color,
                    }}
                  >
                    Precio unit.
                  </Text>
                  <Text
                    style={{
                      flex: 0.9,
                      textAlign: "right",
                      paddingHorizontal: 5,
                      fontSize: 10,
                      fontWeight: "900",
                      color: tema.texto.color,
                    }}
                  >
                    Importe total
                  </Text>
                </View>
                {productos
                  .filter((producto) => (cantidades[producto.id] ?? 0) > 0)
                  .map((producto, indice) => (
                    <View
                      key={producto.id}
                      style={{
                        flexDirection: "row",
                        minHeight: 34,
                        alignItems: "center",
                        borderBottomWidth: 1,
                        borderBottomColor: oscuro ? "#304438" : "#e1e7e2",
                        backgroundColor:
                          indice % 2 === 0
                            ? oscuro
                              ? "#18231d"
                              : "#fff"
                            : oscuro
                              ? "#203126"
                              : "#f7faf8",
                      }}
                    >
                      <Text
                        style={[
                          { flex: 0.9, paddingHorizontal: 5, fontSize: 10 },
                          tema.texto,
                        ]}
                      >
                        {producto.id}
                      </Text>
                      <Text
                        style={[
                          { flex: 1.6, paddingHorizontal: 5, fontSize: 10 },
                          tema.texto,
                        ]}
                      >
                        {producto.nombre}
                      </Text>
                      <Text
                        style={[
                          { flex: 0.55, textAlign: "center", fontSize: 10 },
                          tema.texto,
                        ]}
                      >
                        {cantidades[producto.id]}
                      </Text>
                      <Text
                        style={[
                          { flex: 0.8, textAlign: "right", fontSize: 10 },
                          tema.texto,
                        ]}
                      >
                        {dinero(producto.precio)}
                      </Text>
                      <Text
                        style={[
                          {
                            flex: 0.9,
                            textAlign: "right",
                            paddingHorizontal: 5,
                            fontSize: 10,
                            fontWeight: "800",
                          },
                          tema.texto,
                        ]}
                      >
                        {dinero(
                          producto.precio * (cantidades[producto.id] ?? 0),
                        )}
                      </Text>
                    </View>
                  ))}
                {Array.from({
                  length: Math.max(
                    0,
                    20 -
                      productos.filter(
                        (producto) => (cantidades[producto.id] ?? 0) > 0,
                      ).length,
                  ),
                }).map((_, indice) => (
                  <View
                    key={`fila-vacia-${indice}`}
                    style={{
                      minHeight: 25,
                      borderBottomWidth: 1,
                      borderBottomColor: oscuro ? "#304438" : "#e1e7e2",
                    }}
                  />
                ))}
                <View
                  style={{
                    alignItems: "flex-end",
                    padding: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#9aa79d",
                  }}
                >
                  <Text
                    style={[{ fontSize: 14, fontWeight: "900" }, tema.texto]}
                  >
                    TOTAL PEDIDO: {dinero(total)}
                  </Text>
                </View>
                <View
                  style={{
                    padding: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#9aa79d",
                  }}
                >
                  <Text style={tema.secundario}>
                    Administración y Ventas: 362 421 8193
                  </Text>
                  <Text
                    style={[{ marginTop: 10, fontStyle: "italic" }, tema.texto]}
                  >
                    *Gracias por elegirnos.
                  </Text>
                </View>
              </View>
            </ScrollView>
            <Pressable
              style={[estilos.botonSecundario, { marginTop: 12 }]}
              onPress={() => setModalRemito(false)}
            >
              <Text style={tema.enlace}>Cerrar vista de impresión</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={[estilos.nav, tema.superficie]}>
        <NavBoton
          icono="⌂"
          etiqueta="Inicio"
          activo={vista === "inicio"}
          onPress={() => seleccionarVista("inicio")}
          tema={tema}
        />
        <NavBoton
          icono="＋"
          etiqueta="Pedido"
          activo={vista === "pedido"}
          onPress={() => seleccionarVista("pedido")}
          tema={tema}
        />
        <NavBoton
          icono="▤"
          etiqueta="Historial"
          activo={vista === "historial"}
          onPress={() => seleccionarVista("historial")}
          tema={tema}
        />
      </View>
    </SafeAreaView>
  );
}

function EncabezadoVista({
  titulo,
  volver,
  tema,
}: {
  titulo: string;
  volver: () => void;
  tema: typeof colores.claro;
}): React.JSX.Element {
  return (
    <>
      <Pressable
        style={{ paddingVertical: 10, paddingHorizontal: 2 }}
        onPress={volver}
      >
        <Text style={[{ fontSize: 16, fontWeight: "800" }, tema.enlace]}>
          ‹ Volver
        </Text>
      </Pressable>
      <Text style={[estilos.titulo, tema.texto]}>{titulo}</Text>
    </>
  );
}
function ProductoPrecio({
  producto,
  tema,
}: {
  producto: Producto;
  tema: typeof colores.claro;
}): React.JSX.Element {
  return (
    <View style={[estilos.productoFila, tema.superficie]}>
      <View style={estilos.flexible}>
        <Text style={[estilos.producto, tema.texto]}>{producto.nombre}</Text>
        <Text style={tema.secundario}>
          {producto.id} · {producto.categoria}
        </Text>
      </View>
      <Text style={[estilos.producto, tema.texto]}>
        {dinero(producto.precio)}
      </Text>
    </View>
  );
}
function Resumen({
  numero,
  etiqueta,
  tema,
}: {
  numero: string;
  etiqueta: string;
  tema: typeof colores.claro;
}): React.JSX.Element {
  return (
    <View style={estilos.resumenItem}>
      <Text style={[estilos.numero, tema.texto]}>{numero}</Text>
      <Text style={tema.secundario}>{etiqueta}</Text>
    </View>
  );
}
function NavBoton({
  icono,
  etiqueta,
  activo,
  onPress,
  tema,
}: {
  icono: string;
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  tema: typeof colores.claro;
}): React.JSX.Element {
  return (
    <Pressable style={estilos.navBoton} onPress={onPress}>
      <Text style={[estilos.navIcono, activo ? tema.enlace : tema.secundario]}>
        {icono}
      </Text>
      <Text
        style={[estilos.navEtiqueta, activo ? tema.enlace : tema.secundario]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const estilosModal = StyleSheet.create({
  modalFondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000066",
  },
  modalTarjeta: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    gap: 12,
  },
});
const colores = {
  claro: {
    fondo: { backgroundColor: "#f3f6f4" },
    superficie: { backgroundColor: "#ffffff", borderColor: "#dce6df" },
    texto: { color: "#17221c" },
    secundario: { color: "#637268" },
    enlace: { color: "#176b43" },
    input: {
      backgroundColor: "#ffffff",
      color: "#17221c",
      borderColor: "#d8e2da",
    },
    seleccionado: { backgroundColor: "#e1f0e5", color: "#176b43" },
  },
  oscuro: {
    fondo: { backgroundColor: "#121916" },
    superficie: { backgroundColor: "#1d2a22", borderColor: "#3b5142" },
    texto: { color: "#e7f0e9" },
    secundario: { color: "#afc0b2" },
    enlace: { color: "#9bd3aa" },
    input: {
      backgroundColor: "#25372b",
      color: "#e7f0e9",
      borderColor: "#3b5142",
    },
    seleccionado: { backgroundColor: "#2d4a37", color: "#c4e7ca" },
  },
};
const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { padding: 20, paddingBottom: 100, gap: 14 },
  acceso: { margin: 20, padding: 26, borderRadius: 20, gap: 10 },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marca: { color: "#176b43", fontWeight: "900", letterSpacing: 1.3 },
  temas: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#52705b",
  },
  temaActivo: {
    backgroundColor: "#176b43",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  temaInactivo: {
    backgroundColor: "#dce7de",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  temaTexto: { color: "#fff", fontSize: 11, fontWeight: "800" },
  titulo: { fontSize: 28, fontWeight: "900", marginVertical: 8 },
  subtitulo: { fontSize: 17, fontWeight: "800", marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 11, padding: 13 },
  picker: { borderWidth: 1, borderRadius: 11, marginTop: 2 },
  boton: {
    alignItems: "center",
    backgroundColor: "#176b43",
    borderRadius: 13,
    padding: 16,
  },
  botonTexto: { color: "#fff", fontWeight: "900" },
  botonSecundario: {
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    padding: 14,
  },
  resumen: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  resumenItem: { flex: 1, gap: 4 },
  numero: { fontSize: 19, fontWeight: "900" },
  cliente: { padding: 13, borderRadius: 11, borderWidth: 1, gap: 4 },
  seleccionado: { padding: 13, borderRadius: 11 },
  productoFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    gap: 10,
  },
  producto: { fontWeight: "800" },
  flexible: { flex: 1 },
  controles: { flexDirection: "row", alignItems: "center", gap: 10 },
  controlGrande: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcefe0",
    alignItems: "center",
    justifyContent: "center",
  },
  controlTexto: { color: "#176b43", fontSize: 24, fontWeight: "800" },
  cantidad: { fontSize: 17, fontWeight: "800" },
  remito: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  remitoCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#dce6df",
  },
  etiqueta: { color: "#176b43", fontSize: 11, fontWeight: "900" },
  lineaRemito: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eee9",
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  confirmacion: { alignItems: "center", paddingTop: 70, gap: 14 },
  check: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#dff1e3",
    alignItems: "center",
    justifyContent: "center",
  },
  checkTexto: { color: "#176b43", fontSize: 42, fontWeight: "900" },
  confirmacionTexto: { textAlign: "center", lineHeight: 21 },
  historial: { padding: 15, borderRadius: 14, borderWidth: 1, gap: 12 },
  historialCabecera: { flexDirection: "row", alignItems: "center", gap: 12 },
  detalle: {
    borderTopWidth: 1,
    borderTopColor: "#dce6df",
    paddingTop: 12,
    gap: 8,
  },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  navBoton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    gap: 3,
  },
  navIcono: { fontSize: 21, fontWeight: "800" },
  navEtiqueta: { fontSize: 11, fontWeight: "700" },
  error: { color: "#bd3c3c" },
  deshabilitado: { opacity: 0.4 },
});
