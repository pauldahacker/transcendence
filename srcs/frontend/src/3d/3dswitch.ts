import { toggle3D } from "../tournament/state";


export function setup3DSwitch(container: HTMLElement) {
  const switch3d = container.querySelector("#switch3d") as HTMLInputElement | null;
  const label = container.querySelector("#switch3d-label") as HTMLLabelElement | null;
  const knob = container.querySelector("#switch3d-knob") as HTMLDivElement | null;

  if (!switch3d || !label || !knob) return;

  switch3d.addEventListener("change", () => {
    toggle3D();

    if (switch3d.checked) {
      // -> ON: efecto 3D neón
      label.classList.remove("bg-gray-800","border-gray-600","shadow-none");
      label.classList.add(
        "bg-black","border-cyan-500",
        "shadow-[0_0_10px_#00ffff,0_0_25px_#00ffff,inset_0_0_10px_#00ffff]"
      );

      knob.classList.remove("bg-gray-300","border-gray-400","shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]");
      knob.classList.add(
        "translate-x-[46px]",
        "bg-gradient-to-br","from-pink-300","to-pink-500",
        "border-pink-200",
        "shadow-[0_6px_12px_rgba(255,0,128,0.35)]"
      );
    } else {
      // -> OFF: plano 2D
      label.classList.add("bg-gray-800","border-gray-600","shadow-none");
      label.classList.remove(
        "bg-black","border-cyan-500",
        "shadow-[0_0_10px_#00ffff,0_0_25px_#00ffff,inset_0_0_10px_#00ffff]"
      );

      knob.classList.add("bg-gray-300","border-gray-400","shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]");
      knob.classList.remove(
        "translate-x-[46px]",
        "bg-gradient-to-br","from-pink-300","to-pink-500",
        "border-pink-200",
        "shadow-[0_6px_12px_rgba(255,0,128,0.35)]"
      );
    }
  });
}

