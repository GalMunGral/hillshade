import { Vector3 } from "three";

function getUrl(size: number) {
  return `https://data.isgs.illinois.edu/arcgis/rest/services/Elevation/IL_Statewide_Lidar_DEM_WGS/ImageServer/exportImage?f=image&bbox=-10214509.4008,4397450.9011,-9695960.6009,5270667.5123&bboxSR=3857&imageSR=3857&size=${size},${size}&format=png`;
}

async function loadDemData(size: number) {
  const res = await fetch(getUrl(size));
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = new Array(height).fill(0).map(() => new Array(width).fill(0));
  for (let i = 0; i < height; ++i) {
    for (let j = 0; j < width; ++j) {
      data[i][j] = imageData.data[4 * (i * width + j)] / 255;
    }
  }
  return {
    width,
    height,
    data,
  };
}

let ambient = 0.2;
let diffuse = 0;
let specular = 1;

let exaggeration = 1;

let theta = 0;
let phi = 45;

function shade(data: number[][], i: number, j: number): number {
  const N = new Vector3(
    exaggeration * (data[i][j - 1] - data[i][j + 1]),
    exaggeration * (data[i + 1][j] - data[i - 1][j]),
    2
  ).normalize();

  const L = new Vector3(
    Math.cos(phi * (Math.PI / 180)) * Math.cos(theta * (Math.PI / 180)),
    Math.cos(phi * (Math.PI / 180)) * Math.sin(theta * (Math.PI / 180)),
    Math.sin(phi * (Math.PI / 180))
  ).normalize();

  const d = L.dot(N);

  const R = N.clone()
    .multiplyScalar(2 * d)
    .sub(L);

  const V = new Vector3(0, 0, 1);

  return ambient + diffuse * d + specular * R.dot(V) ** 3;
}

function render(data: number[][], ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  const imageData = new ImageData(width, height);
  for (let i = 1; i < height - 1; ++i) {
    for (let j = 1; j < width - 1; ++j) {
      const s = shade(data, i, j) * 255;
      imageData.data[4 * (i * width + j)] = s;
      imageData.data[4 * (i * width + j) + 1] = s;
      imageData.data[4 * (i * width + j) + 2] = s;
      imageData.data[4 * (i * width + j) + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

(async () => {
  const ambientInput = document.querySelector("#ambient")! as HTMLInputElement;
  ambientInput.value = String(ambient);
  ambientInput.oninput = () => {
    ambient = +ambientInput.value;
    render(data, ctx);
  };

  const diffuseInput = document.querySelector("#diffuse")! as HTMLInputElement;
  diffuseInput.value = String(diffuse);
  diffuseInput.oninput = () => {
    diffuse = +diffuseInput.value;
    render(data, ctx);
  };

  const specularInput = document.querySelector(
    "#specular"
  )! as HTMLInputElement;
  specularInput.value = String(specular);
  specularInput.oninput = () => {
    specular = +specularInput.value;
    render(data, ctx);
  };

  const exaggerationInput = document.querySelector(
    "#exaggeration"
  )! as HTMLInputElement;
  exaggerationInput.value = String(exaggeration);
  exaggerationInput.oninput = () => {
    exaggeration = +exaggerationInput.value;
    render(data, ctx);
  };

  const thetaInput = document.querySelector("#theta")! as HTMLInputElement;
  thetaInput.value = String(theta);
  thetaInput.oninput = () => {
    theta = +thetaInput.value;
    render(data, ctx);
  };

  const phiInput = document.querySelector("#phi")! as HTMLInputElement;
  phiInput.value = String(phi);
  phiInput.oninput = () => {
    phi = +phiInput.value;
    render(data, ctx);
  };

  const { width, height, data } = await loadDemData(512);
  const canvas = document.querySelector("#hillshade")! as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;

  render(data, ctx);
})();
