export class UI {
  constructor() {
    this.healthElement = document.getElementById("health");
    this.ammoElement = document.getElementById("ammo");
    this.killsElement = document.getElementById("kills");
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
}
