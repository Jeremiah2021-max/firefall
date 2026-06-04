import * as THREE from "three";
import { Weapon } from "./Weapon.js";

export class Pistol extends Weapon {
  constructor() {
    super();
    this.name = "Pistol";
    this.damage = 15;
    this.magazine = 15;
    this.reserveAmmo = 60;
    this.recoilRecovery = 0.97;
  }

  createGun() {
    const gunGroup = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x333333
      })
    );

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x222222
      })
    );

    handle.position.set(0, -0.12, -0.1);

    gunGroup.add(body);
    gunGroup.add(handle);

    return gunGroup;
  }

  applyRecoil() {
    if (this.gun) {
      this.gun.position.z += 0.05;
      setTimeout(() => {
        this.gun.position.z -= 0.05;
      }, 50);
    }
  }

  createBullet() {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00
      })
    );

    bullet.position.copy(this.camera.position);

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    this.bullets.push({
      mesh: bullet,
      direction
    });

    this.scene.add(bullet);
  }

  update() {
    this.updateRecoil();
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(2));

      if (bullet.mesh.position.distanceTo(this.camera.position) > 200) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }
}
