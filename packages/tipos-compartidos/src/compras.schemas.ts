import { z } from "zod";

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD");

const datosProductoSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  categoriaCodigo: z.enum(["ALI", "SNK", "BEB"]),
  subcategoriaCodigo: z.enum(["V", "C", "G"]).nullable(),
});

const validarCategoriaProducto = (
  producto: z.infer<typeof datosProductoSchema>,
  contexto: z.RefinementCtx,
): void => {
  if (producto.categoriaCodigo === "BEB" && !producto.subcategoriaCodigo) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Las bebidas requieren subcategoría.",
    });
  }
  if (producto.categoriaCodigo !== "BEB" && producto.subcategoriaCodigo) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Solo las bebidas admiten subcategoría.",
    });
  }
};

export const nuevoProductoCompraSchema = datosProductoSchema.superRefine(
  validarCategoriaProducto,
);

export const lineaCompraSchema = z
  .object({
    productoId: z.string().uuid().nullable().optional(),
    nuevoProducto: nuevoProductoCompraSchema.nullable().optional(),
    cantidad: z.number().int().positive(),
    costoUnitario: z.number().nonnegative(),
    fechaVencimiento: fechaSchema.nullable().optional(),
  })
  .superRefine((linea, contexto) => {
    if (!linea.productoId && !linea.nuevoProducto) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccioná un producto o completá el nuevo producto.",
      });
    }
    if (linea.productoId && linea.nuevoProducto) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Una línea no puede tener producto existente y nuevo a la vez.",
      });
    }
  });

export const registrarCompraSchema = z.object({
  nroFactura: z.string().trim().min(1).max(100),
  proveedor: z.string().trim().min(1).max(200),
  sucursalProveedor: z.string().trim().min(1).max(200),
  fechaCompra: fechaSchema,
  notas: z.string().trim().max(1000).nullable().optional(),
  lineas: z.array(lineaCompraSchema).min(1),
});

export type RegistrarCompraEntrada = z.infer<typeof registrarCompraSchema>;

export const crearProductoSchema = datosProductoSchema
  .extend({
    precioVenta: z.number().nonnegative(),
    markupPct: z.number().min(0).max(100),
  })
  .superRefine(validarCategoriaProducto);
export type CrearProductoEntrada = z.infer<typeof crearProductoSchema>;

export const crearProductoRespuestaSchema = z.object({ id: z.string().uuid() });

export const actualizarProductoPreciosSchema = z.object({
  id: z.string().uuid(),
  precioVenta: z.number().nonnegative(),
  markupPct: z.number().min(0).max(100),
});

export const actualizarProductoPreciosRespuestaSchema = z.object({
  actualizado: z.literal(true),
});

export type ActualizarProductoPreciosEntrada = z.infer<
  typeof actualizarProductoPreciosSchema
>;

export interface CompraRegistrada {
  id: string;
}

export interface CompraHistorial {
  id: string;
  numeroInterno: number;
  nroFactura: string;
  proveedor: string;
  sucursalProveedor: string | null;
  fechaCompra: string;
  montoTotal: number;
  creadoEn: string | null;
  lineas: Array<{
    id: string;
    productoId: string | null;
    sku: string | null;
    nombreProducto: string | null;
    cantidad: number;
    costoUnitario: number;
    subtotal: number | null;
    fechaVencimiento: string | null;
  }>;
}

export const compraHistorialSchema = z.object({
  id: z.string().uuid(),
  numeroInterno: z.number().int(),
  nroFactura: z.string(),
  proveedor: z.string(),
  sucursalProveedor: z.string().nullable(),
  fechaCompra: fechaSchema,
  montoTotal: z.number(),
  creadoEn: z.string().nullable(),
  lineas: z.array(
    z.object({
      id: z.string().uuid(),
      productoId: z.string().uuid().nullable(),
      sku: z.string().nullable(),
      nombreProducto: z.string().nullable(),
      cantidad: z.number().int(),
      costoUnitario: z.number(),
      subtotal: z.number().nullable(),
      fechaVencimiento: fechaSchema.nullable(),
    }),
  ),
});

export const registrarCompraRespuestaSchema = z.object({
  id: z.string().uuid(),
  montoTotal: z.number().nonnegative(),
});
