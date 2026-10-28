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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
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
  stock: number;
}
interface Cliente {
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
}
interface LineaPedidoVendedor {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
}
interface PedidoVendedor {
  id: string;
  numero: number;
  fecha: string;
  cliente: Cliente;
  condicionPago: string;
  lineas: LineaPedidoVendedor[];
  importeTotal: number;
  porcentajeComision: number;
  ganancia: number | null;
  usuarioId?: string;
  nombreVendedor?: string;
  vendidoPorDueno?: boolean;
}
interface UsuarioMovil {
  id: string;
  nombre: string;
  rol: "vendedor" | "dueno";
}
const USUARIO_VENDEDOR: UsuarioMovil = {
  id: "martin",
  nombre: "Martín",
  rol: "vendedor",
};
const USUARIO_DUENO: UsuarioMovil = {
  id: "fabio",
  nombre: "Fabio",
  rol: "dueno",
};
const CLAVE_PEDIDOS_LOCALES = "fontana.pedidos-vendedor.v1";
const PORCENTAJE_COMISION_VENDEDOR = 10;

function esPedidoVendedor(valor: unknown): valor is PedidoVendedor {
  if (typeof valor !== "object" || valor === null) return false;
  const pedido = valor as Record<string, unknown>;
  if (
    typeof pedido.id !== "string" ||
    typeof pedido.numero !== "number" ||
    typeof pedido.fecha !== "string" ||
    typeof pedido.condicionPago !== "string" ||
    typeof pedido.importeTotal !== "number" ||
    typeof pedido.porcentajeComision !== "number" ||
    (typeof pedido.ganancia !== "number" && pedido.ganancia !== null) ||
    !Array.isArray(pedido.lineas) ||
    typeof pedido.cliente !== "object" ||
    pedido.cliente === null
  ) return false;
  const cliente = pedido.cliente as Record<string, unknown>;
  return (
    typeof cliente.codigo === "string" &&
    typeof cliente.nombre === "string" &&
    typeof cliente.direccion === "string" &&
    typeof cliente.telefono === "string" &&
    pedido.lineas.every((linea: unknown) => {
      if (typeof linea !== "object" || linea === null) return false;
      const item = linea as Record<string, unknown>;
      return typeof item.productoId === "string" &&
        typeof item.nombreProducto === "string" &&
        typeof item.cantidad === "number" &&
        typeof item.precioUnitario === "number";
    })
  );
}
const productosBase = [
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
  { id: "ALI-046.1", nombre: "Fideo Santa Isabel 500g Mostachol", categoria: "Almacén", precio: 600 },
  { id: "ALI-047.1", nombre: "Fideo Santa Isabel 500g Spaghetti", categoria: "Almacén", precio: 600 },
  { id: "ALI-048.1", nombre: "Fideo Santa Isabel 500g Tallarín", categoria: "Almacén", precio: 600 },
  { id: "ALI-050.OF", nombre: "Puré de tomate Santa Isabel 520g", categoria: "Almacén", precio: 620 },
  { id: "ALI-036.0", nombre: "Aceite Legítimo 1500cc", categoria: "Almacén", precio: 4750 },
  { id: "ALI-037.OF", nombre: "Aceite Legítimo 900cc", categoria: "Almacén", precio: 3190 },
  { id: "ALI-061", nombre: "Arroz largo fino 1kg", categoria: "Almacén", precio: 1250 },
  { id: "ALI-072", nombre: "Azúcar común 1kg", categoria: "Almacén", precio: 1100 },
  { id: "ALI-083", nombre: "Harina de trigo 1kg", categoria: "Almacén", precio: 980 },
  { id: "ALI-091", nombre: "Yerba mate 1kg", categoria: "Almacén", precio: 2850 },
  { id: "BEB-G002.1", nombre: "Coca-Cola PET 2250cc", categoria: "Bebidas", precio: 3600 },
  { id: "BEB-G007.NF", nombre: "Sprite PET 2250cc", categoria: "Bebidas", precio: 3600 },
  { id: "BEB-G014.1", nombre: "Aquarius 2500cc Limonada", categoria: "Bebidas", precio: 2135 },
  { id: "BEB-G015.1", nombre: "Aquarius 2500cc Manzana", categoria: "Bebidas", precio: 2135 },
  { id: "BEB-V012", nombre: "Alaris Malbec", categoria: "Bebidas", precio: 4100 },
  { id: "BEB-L001.1", nombre: "Fernet Branca 750cc", categoria: "Bebidas", precio: 14450 },
  { id: "SNK-002", nombre: "Crutons Minitostaditas Jamón", categoria: "Snacks", precio: 1800 },
  { id: "SNK-004", nombre: "Crutons Minitostaditas Salame", categoria: "Snacks", precio: 1800 },
  { id: "SNK-011", nombre: "Papas fritas clásicas 100g", categoria: "Snacks", precio: 1500 },
  { id: "SNK-014", nombre: "Maní tostado salado 100g", categoria: "Snacks", precio: 950 },
];
const STOCK_DEMO = [168, 0, 24, 12, 30, 18, 228, 42, 55, 60, 36, 84, 120, 48, 22, 24, 18, 36, 12, 45, 0, 32, 28, 15];
const productos: Producto[] = productosBase.map((producto, indice) => ({
  ...producto,
  stock: STOCK_DEMO[indice] ?? 0,
}));
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
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioMovil | null>(null);
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
  const [paginaProductos, setPaginaProductos] = useState(0);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoVendedor[]>([]);
  const [pedidosCargados, setPedidosCargados] = useState(false);
  const [almacenamientoDisponible, setAlmacenamientoDisponible] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [paginaPrecios, setPaginaPrecios] = useState(0);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalRemito, setModalRemito] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const tema = oscuro ? colores.oscuro : colores.claro;
  const categorias = [
    "Todas",
    ...new Set(
      productos
        .filter((producto) => producto.stock > 0)
        .map((producto) => producto.categoria),
    ),
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
      item.stock > 0 &&
      item.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
      (categoria === "Todas" || item.categoria === categoria),
  );
  const productosPorPagina = 10;
  const totalPaginasProductos = Math.max(
    1,
    Math.ceil(productosFiltrados.length / productosPorPagina),
  );
  const paginaProductosVisible = Math.min(
    paginaProductos,
    totalPaginasProductos - 1,
  );
  const productosPaginados = productosFiltrados.slice(
    paginaProductosVisible * productosPorPagina,
    (paginaProductosVisible + 1) * productosPorPagina,
  );
  const productosPorPaginaPrecios = 20;
  const totalPaginasPrecios = Math.max(
    1,
    Math.ceil(productosFiltrados.length / productosPorPaginaPrecios),
  );
  const paginaPreciosVisible = Math.min(paginaPrecios, totalPaginasPrecios - 1);
  const productosPaginadosPrecios = productosFiltrados.slice(
    paginaPreciosVisible * productosPorPaginaPrecios,
    (paginaPreciosVisible + 1) * productosPorPaginaPrecios,
  );
  const ahora = new Date();
  const pedidosDelUsuario = pedidos.filter(
    (pedido) =>
      pedido.usuarioId === usuarioActivo?.id ||
      (!pedido.usuarioId && usuarioActivo?.id === USUARIO_VENDEDOR.id),
  );
  const pedidosDelDia = pedidosDelUsuario.filter((pedido) => {
    const fecha = new Date(pedido.fecha);
    return fecha.toDateString() === ahora.toDateString();
  });
  const pedidosDelMes = pedidosDelUsuario.filter((pedido) => {
    const fecha = new Date(pedido.fecha);
    return fecha.getFullYear() === ahora.getFullYear() &&
      fecha.getMonth() === ahora.getMonth();
  });
  const gananciaTotalVendedor = pedidosDelUsuario.reduce(
    (suma, pedido) => suma + (pedido.ganancia ?? 0),
    0,
  );
  const productosEnPedido = productos.filter(
    (producto) => (cantidades[producto.id] ?? 0) > 0,
  );
  useEffect(() => {
    setPaginaProductos(0);
  }, [busquedaProducto, categoria]);
  useEffect(() => {
    setPaginaPrecios(0);
  }, [busquedaProducto, categoria]);
  useEffect(() => {
    let activo = true;
    void AsyncStorage.getItem(CLAVE_PEDIDOS_LOCALES)
      .then((contenido) => {
        if (!activo || !contenido) return;
        const datos: unknown = JSON.parse(contenido);
        if (Array.isArray(datos)) setPedidos(datos.filter(esPedidoVendedor));
      })
      .then(() => {
        if (activo) setAlmacenamientoDisponible(true);
      })
      .catch((error: unknown) => {
        if (activo) {
          const detalle = error instanceof Error ? error.message : String(error);
          Alert.alert("Historial", `No se pudieron cargar los pedidos guardados. ${detalle}`);
        }
      })
      .finally(() => {
        if (activo) setPedidosCargados(true);
      });
    return () => {
      activo = false;
    };
  }, []);
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
      [id]: Math.min(
        productos.find((producto) => producto.id === id)?.stock ?? 0,
        Math.max(0, (actuales[id] ?? 0) + cambio),
      ),
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
  const confirmarPedido = async (): Promise<void> => {
    if (!cliente || !pedidosCargados || !almacenamientoDisponible || guardandoPedido || total <= 0) return;
    const productoSinStock = productosEnPedido.find(
      (producto) => (cantidades[producto.id] ?? 0) > producto.stock,
    );
    if (productoSinStock) {
      Alert.alert(
        "Stock insuficiente",
        `${productoSinStock.nombre}: hay ${productoSinStock.stock} unidades disponibles.`,
      );
      return;
    }
    setGuardandoPedido(true);
    const lineas = productos
      .filter((producto) => (cantidades[producto.id] ?? 0) > 0)
      .map((producto) => ({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: cantidades[producto.id] ?? 0,
        precioUnitario: producto.precio,
      }));
    const importeTotal = lineas.reduce(
      (suma, linea) => suma + linea.cantidad * linea.precioUnitario,
      0,
    );
    const numero = pedidos.reduce(
      (mayor, pedido) => Math.max(mayor, pedido.numero),
      9999,
    ) + 1;
    const esVentaDelDueno = usuarioActivo?.rol === "dueno";
    const porcentajeComision = esVentaDelDueno
      ? 0
      : PORCENTAJE_COMISION_VENDEDOR;
    const pedido: PedidoVendedor = {
      id: `PED-${numero}`,
      numero,
      fecha: new Date().toISOString(),
      cliente: { ...cliente },
      condicionPago,
      lineas,
      importeTotal,
      porcentajeComision,
      ganancia: esVentaDelDueno
        ? null
        : Math.round(importeTotal * porcentajeComision / 100),
      usuarioId: usuarioActivo?.id ?? USUARIO_VENDEDOR.id,
      nombreVendedor: usuarioActivo?.nombre ?? USUARIO_VENDEDOR.nombre,
      vendidoPorDueno: esVentaDelDueno,
    };
    const pedidosActualizados = [pedido, ...pedidos];
    try {
      await AsyncStorage.setItem(
        CLAVE_PEDIDOS_LOCALES,
        JSON.stringify(pedidosActualizados),
      );
      setPedidos(pedidosActualizados);
      setCantidades({});
      setCliente(null);
      setModalRemito(false);
      seleccionarVista("confirmado");
    } catch (error: unknown) {
      const detalle = error instanceof Error ? error.message : String(error);
      Alert.alert("No se guardó el pedido", `No se pudo escribir en el almacenamiento local. ${detalle}`);
    } finally {
      setGuardandoPedido(false);
    }
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
          <Text style={tema.secundario}>Código de acceso</Text>
          <Text style={tema.secundario}>
            Martín · pass1234  |  Fabio (dueño) · password
          </Text>
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
              const usuario =
                codigo === "pass1234"
                  ? USUARIO_VENDEDOR
                  : codigo === "password"
                    ? USUARIO_DUENO
                    : null;
              setError(usuario === null);
              if (usuario) {
                setUsuarioActivo(usuario);
                setAutenticado(true);
              }
            }}
          >
            <Text style={estilos.botonTexto}>Ingresar</Text>
          </Pressable>
          {error && (
            <Text style={estilos.error}>
              Código incorrecto. Probá con pass1234 o password.
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
            <Text style={tema.secundario}>
              {usuarioActivo?.rol === "dueno" ? "Dueño" : "Vendedor"} · {usuarioActivo?.nombre}
            </Text>
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
              <Resumen numero={String(pedidosDelDia.length)} etiqueta="Pedidos del día" tema={tema} />
              <Resumen numero={String(pedidosDelMes.length)} etiqueta="Pedidos del mes" tema={tema} />
              <Resumen
                numero={
                  usuarioActivo?.rol === "dueno"
                    ? "—"
                    : dinero(gananciaTotalVendedor)
                }
                etiqueta={
                  usuarioActivo?.rol === "dueno"
                    ? "Ganancia neta (requiere costos)"
                    : "Comisiones ganadas"
                }
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
            <Text style={tema.secundario}>
              {productosFiltrados.length} productos · página {paginaPreciosVisible + 1} de {totalPaginasPrecios}
            </Text>
            {productosPaginadosPrecios.map((producto) => (
              <ProductoPrecio
                key={producto.id}
                producto={producto}
                tema={tema}
              />
            ))}
            <View style={[estilos.paginacion, tema.superficie]}>
              <Pressable
                disabled={paginaPreciosVisible === 0}
                style={[estilos.botonPagina, paginaPreciosVisible === 0 && estilos.deshabilitado]}
                onPress={() => setPaginaPrecios((pagina) => Math.max(0, pagina - 1))}
              >
                <Text style={estilos.botonPaginaTexto}>‹ Anterior</Text>
              </Pressable>
              <Text style={tema.secundario}>
                Página {paginaPreciosVisible + 1} de {totalPaginasPrecios}
              </Text>
              <Pressable
                disabled={paginaPreciosVisible >= totalPaginasPrecios - 1}
                style={[estilos.botonPagina, paginaPreciosVisible >= totalPaginasPrecios - 1 && estilos.deshabilitado]}
                onPress={() => setPaginaPrecios((pagina) => Math.min(totalPaginasPrecios - 1, pagina + 1))}
              >
                <Text style={estilos.botonPaginaTexto}>Siguiente ›</Text>
              </Pressable>
            </View>
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
            {productosPaginados.map((producto) => (
              <View
                key={producto.id}
                style={[estilos.productoFila, tema.superficie]}
              >
                <View style={estilos.flexible}>
                  <Text style={[estilos.producto, tema.texto]}>
                    {producto.nombre}
                  </Text>
                  <Text style={tema.secundario}>
                    {producto.categoria} · {dinero(producto.precio)} · Disponible: {producto.stock}
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
                    disabled={(cantidades[producto.id] ?? 0) >= producto.stock}
                    style={[
                      estilos.controlGrande,
                      (cantidades[producto.id] ?? 0) >= producto.stock && estilos.deshabilitado,
                    ]}
                    onPress={() => cambiarCantidad(producto.id, 1)}
                  >
                    <Text style={estilos.controlTexto}>＋</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={[estilos.paginacion, tema.superficie]}>
              <Pressable
                disabled={paginaProductosVisible === 0}
                style={[estilos.botonPagina, paginaProductosVisible === 0 && estilos.deshabilitado]}
                onPress={() => setPaginaProductos((pagina) => Math.max(0, pagina - 1))}
              >
                <Text style={estilos.botonPaginaTexto}>‹ Anterior</Text>
              </Pressable>
              <Text style={tema.secundario}>
                Página {paginaProductosVisible + 1} de {totalPaginasProductos}
              </Text>
              <Pressable
                disabled={paginaProductosVisible >= totalPaginasProductos - 1}
                style={[estilos.botonPagina, paginaProductosVisible >= totalPaginasProductos - 1 && estilos.deshabilitado]}
                onPress={() => setPaginaProductos((pagina) => Math.min(totalPaginasProductos - 1, pagina + 1))}
              >
                <Text style={estilos.botonPaginaTexto}>Siguiente ›</Text>
              </Pressable>
            </View>
            <View style={[estilos.resumenPedido, tema.superficie]}>
              <Text style={[estilos.producto, tema.texto]}>Resumen del pedido</Text>
              {productosEnPedido.length === 0 ? (
                <Text style={tema.secundario}>Los productos que agregues aparecerán aquí.</Text>
              ) : (
                productosEnPedido.map((producto) => {
                  const cantidad = cantidades[producto.id] ?? 0;
                  return (
                    <View key={producto.id} style={estilos.lineaResumen}>
                      <Text style={[estilos.flexible, tema.texto]}>
                        {cantidad} × {producto.nombre}
                      </Text>
                      <Text style={tema.texto}>{dinero(cantidad * producto.precio)}</Text>
                    </View>
                  );
                })
              )}
              <View style={estilos.lineaResumen}>
                <Text style={[estilos.producto, tema.texto]}>Total</Text>
                <Text style={[estilos.producto, tema.texto]}>{dinero(total)}</Text>
              </View>
            </View>
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
              disabled={!pedidosCargados || !almacenamientoDisponible || guardandoPedido}
              style={[
                estilos.boton,
                (!pedidosCargados || !almacenamientoDisponible || guardandoPedido) && estilos.deshabilitado,
              ]}
              onPress={() => {
                void confirmarPedido();
              }}
            >
              <Text style={estilos.botonTexto}>
                {guardandoPedido ? "Guardando pedido…" : "Confirmar pedido"}
              </Text>
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
            {!pedidosCargados ? (
              <Text style={tema.secundario}>Cargando pedidos guardados…</Text>
            ) : pedidosDelUsuario.length === 0 ? (
              <View style={[estilos.historial, tema.superficie]}>
                <Text style={[estilos.producto, tema.texto]}>Todavía no hay pedidos</Text>
                <Text style={tema.secundario}>
                  Los pedidos que confirmes aparecerán aquí, incluso después de cerrar y volver a abrir la app.
                </Text>
              </View>
            ) : pedidosDelUsuario.map((pedido) => {
              const abierto = detalleAbierto === pedido.id;
              return (
                <Pressable
                  key={pedido.id}
                  style={[estilos.historial, tema.superficie]}
                  onPress={() => setDetalleAbierto(abierto ? null : pedido.id)}
                >
                  <View style={estilos.historialCabecera}>
                    <View style={estilos.flexible}>
                      <Text style={[estilos.producto, tema.texto]} numberOfLines={2}>
                        #{pedido.numero} · {pedido.cliente.nombre}
                      </Text>
                      <Text style={tema.secundario}>
                        {new Date(pedido.fecha).toLocaleDateString("es-AR")} · {dinero(pedido.importeTotal)}
                      </Text>
                    </View>
                    <Text style={tema.enlace}>{abierto ? "Cerrar" : "Detalle"}</Text>
                  </View>
                  {abierto && (
                    <View style={estilos.detalle}>
                      {pedido.lineas.map((linea) => (
                        <Text key={linea.productoId} style={tema.secundario}>
                          {linea.cantidad} × {linea.nombreProducto} · {dinero(linea.cantidad * linea.precioUnitario)}
                        </Text>
                      ))}
                      <Text style={[estilos.producto, tema.texto]}>
                        Importe total: {dinero(pedido.importeTotal)}
                      </Text>
                      <Text style={tema.secundario}>
                        Condición de pago: {etiquetaCondicion(pedido.condicionPago)}
                      </Text>
                      <Text style={tema.secundario}>
                        Comisión aplicada: {pedido.vendidoPorDueno ? "No aplica (venta del dueño)" : `${pedido.porcentajeComision}%`}
                      </Text>
                      {pedido.ganancia === null ? (
                        <Text style={tema.secundario}>
                          Ganancia neta no calculada: faltan los costos de lote en este catálogo de prueba.
                        </Text>
                      ) : (
                        <Text style={[estilos.producto, tema.enlace]}>
                          Ganancia del pedido: {dinero(pedido.ganancia)}
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
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
          {producto.id} · {producto.categoria} · Stock disponible: {producto.stock}
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
  paginacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  botonPagina: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: "#176b43",
  },
  botonPaginaTexto: { color: "#fff", fontSize: 12, fontWeight: "800" },
  resumenPedido: { padding: 14, borderWidth: 1, borderRadius: 14, gap: 9 },
  lineaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
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
