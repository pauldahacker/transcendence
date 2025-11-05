import { 
	Engine,
	Mesh,
	Scene, 
	ArcRotateCamera, 
	Vector3, 
	HemisphericLight, 
	MeshBuilder, 
	Color3, 
	StandardMaterial, 
  Texture,
	DynamicTexture, 
} from "babylonjs";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type ScoreLightsOptions = {
  lightSize?: number; 
  gap?: number;
  onColor?: Color3;
  offColor?: Color3;
  position?: Vector3;
};

export class ScoreLights {
  private scene: Scene;
  private meshes: Mesh[] = [];
  private onMat: StandardMaterial;
  private offMat: StandardMaterial;
  private flashing: boolean[] = [false, false, false];

  constructor(scene: Scene, opts: ScoreLightsOptions = {}) {
    this.scene = scene;

    const {
      lightSize = 0.25,
      gap = 0.12,
      onColor = Color3.FromHexString("#6aa509"),
      offColor = Color3.FromHexString("#334155"),
      position = new Vector3(0, 0, 0),
    } = opts;

    // materials
    this.onMat = new StandardMaterial("scoreOnMat", scene);
    this.onMat.diffuseColor = onColor;
    this.onMat.emissiveColor = onColor;

    this.offMat = new StandardMaterial("scoreOffMat", scene);
    this.offMat.diffuseColor = offColor;
    this.offMat.emissiveColor = offColor.scale(0.4);

    const totalWidth = 3 * lightSize + 2 * gap;
    const halfWidth = totalWidth / 2;
    const centerOffset = halfWidth - (lightSize / 2);

    for (let i = 0; i < 3; i++) {
      const m = MeshBuilder.CreateBox(
        `scoreLight_${Math.random().toString(36).slice(2)}`,
        { size: lightSize },
        scene
      );
      m.material = this.offMat;

      const xOffset = i * (lightSize + gap) - centerOffset;
      m.position = new Vector3(
        position.x + xOffset,
        position.y,
        position.z
      );
      this.meshes.push(m);
    }
  }

  async update(score: number) {
    const n = score;
    for (let i = 0; i < 3; i++) {
      if (i < n) {
        if (!this.flashing[i] && this.meshes[i].material === this.offMat) {
          this.flashing[i] = true;
          this.meshes[i].scaling.set(1, 1.5, 1);
          for (let t = 0; t < 5; t++) {
            this.meshes[i].material = this.onMat;
            await sleep(70);
            this.meshes[i].material = this.offMat;
            await sleep(100);
          }

          this.meshes[i].material = this.onMat;
          this.flashing[i] = false;
        }
      } else {
        this.meshes[i].material = this.offMat;
        this.meshes[i].scaling.set(1, 1.0, 1);
      }
    }
  }

  dispose() {
    this.meshes.forEach((m) => m.dispose());
    this.onMat.dispose();
    this.offMat.dispose();
    this.meshes = [];
  }
}


export function buildborders(scene: Scene, W: number, H: number){
  const topB = MeshBuilder.CreateBox(
    "topB",
    { width: W, height: 0.2, depth: .3 },
    scene
  );
  const borderMat = new StandardMaterial("matP2", scene);
  borderMat.diffuseColor = Color3.FromHexString("#E5375D");
  topB.material = borderMat;
  topB.position.x = 0;
  topB.position.z = H/2 + 0.3/2 + 0.0001;
  topB.position.y = 0;
  const bottomB = MeshBuilder.CreateBox(
    "bottomB",
    { width: W, height: 0.2, depth: .3 },
    scene
  );
  bottomB.material = borderMat;
  bottomB.position.x = 0;
  bottomB.position.z = -(H/2 + 0.3/2 + 0.0001);
  bottomB.position.y = 0;

  const sideMat = new StandardMaterial("graySideMat", scene);
  sideMat.diffuseColor = Color3.FromHexString("#6B7280"); // Tailwind gray-500
  sideMat.emissiveColor = sideMat.diffuseColor;
  sideMat.disableLighting = true;

  const sideThickness = 0.01; // thin border
  const sideHeight = 0.01;
  const sideDepth = H;

  const leftB = MeshBuilder.CreateBox("leftB", { width: sideThickness, height: sideHeight, depth: sideDepth }, scene);
  leftB.material = sideMat;
  leftB.position.set(-(W / 2 + sideThickness / 2 + 0.0001), 0, 0);

  const rightB = MeshBuilder.CreateBox("rightB", { width: sideThickness, height: sideHeight, depth: sideDepth }, scene);
  rightB.material = sideMat;
  rightB.position.set(W / 2 + sideThickness / 2 + 0.0001, 0, 0);
}


export function addSkyDome(scene: Scene, mapPath?: string) {
  // If no map, plain blue dome (no texture)
  if (!mapPath || mapPath.trim() === "") {
    const dome = MeshBuilder.CreateSphere(
      "skyDome",
      {
        diameter: 150,
        segments: 32,
        sideOrientation: Mesh.BACKSIDE,
      },
      scene
    );

    const mat = new StandardMaterial("skyDomeMat", scene);
    mat.diffuseColor = Color3.FromHexString("#164E63"); // same cyan-blue as your default background
    mat.emissiveColor = Color3.FromHexString("#164E63");
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    dome.material = mat;
    return dome;
  }

  // Otherwise, load texture
  const texture = new Texture(mapPath, scene);
  texture.uScale = 20;
  texture.vScale = -8;

  const dome = MeshBuilder.CreateSphere(
    "skyDome",
    {
      diameter: 150,
      segments: 32,
      sideOrientation: Mesh.BACKSIDE,
    },
    scene
  );

  const mat = new StandardMaterial("skyDomeMat", scene);
  mat.diffuseTexture = texture;
  mat.emissiveTexture = texture;
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  dome.material = mat;

  return dome;
}

