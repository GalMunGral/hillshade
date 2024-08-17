export type TypedArray = Float32Array | Uint16Array;
export type TypedArrayConstructor = new (a: ArrayBuffer) => TypedArray;

export async function loadDEM(size: number): Promise<ImageBitmap> {
  const res = await fetch(
    `https://data.isgs.illinois.edu/arcgis/rest/services/Elevation/IL_Statewide_Lidar_DEM_WGS/ImageServer/exportImage?f=image&bbox=-10214509.4008,4397450.9011,-9695960.6009,5270667.5123&bboxSR=3857&imageSR=3857&size=${size},${size}&format=png`
  );
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

export function createBuffer(
  device: GPUDevice,
  data: TypedArray,
  usage: GPUTextureUsageFlags
): GPUBuffer {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage,
    mappedAtCreation: true,
  });
  const dst = new (data.constructor as TypedArrayConstructor)(
    buffer.getMappedRange()
  );
  dst.set(data);
  buffer.unmap();
  return buffer;
}
