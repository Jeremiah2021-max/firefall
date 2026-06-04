import * as THREE from "three";
import { Weapon } from "./Weapon.js";

export class Rifle extends Weapon {
  constructor() {
    super();
    this.name = "Rifle";
    this.damage = 35;
    this.magazine = 30;
    this.reserveAmmo = 120;
    this.recoilRecovery = 0.92;
  }

  createGun() {
    const gunGroup = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 1),
      new THREE.MeshStandardMaterial({
        color: 0x222222
      })
    );

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.3, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x111111
      })
    );

    handle.position.set(0, -0.2, -0.2);

    gunGroup.add(body);
    gunGroup.add(handle);

    return gunGroup;
  }

  applyRecoil() {
    if (this.gun) {
      this.gun.position.z += 0.1;
      setTimeout(() => {
        this.gun.position.z -= 0.1;
      }, 50);
    }
  }

  createBullet() {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff6b35
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
      bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(3));

      if (bullet.mesh.position.distanceTo(this.camera.position) > 200) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }
}
