export class UI {
  constructor() {
    this.healthElement = document.getElementById("health");
    this.ammoElement = document.getElementById("ammo");
    this.killsElement = document.getElementById("kills");
    this.crosshairElement = document.getElementById("crosshair");
  }

  update(health, ammo, reserveAmmo, kills) {
    if (this.healthElement) {
      this.healthElement.innerText = `Health: ${health}`;
    }
    if (this.ammoElement) {
      this.ammoElement.innerText = `Ammo: ${ammo}/${reserveAmmo}`;
    }
    if (this.killsElement) {
      this.killsElement.innerText = `Kills: ${kills}`;
    }
  }

  updateCrosshair(zoomLevel) {
    if (this.crosshairElement) {
      if (zoomLevel > 1.5) {
        this.crosshairElement.classList.add("scoped");
        this.crosshairElement.textContent = "";
      } else {
        this.crosshairElement.classList.remove("scoped");
        this.crosshairElement.textContent = "+";
      }
    }
  }
}
