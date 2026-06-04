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
    this.zoomLevel = 1;
    this.minZoom = 1;
    this.maxZoom = 2;
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
    this.createMuzzleFlash();

    const tracer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffff00
      })
    );

    tracer.position.copy(this.camera.position);

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // Rotate tracer to align with bullet direction
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    this.bullets.push({
      mesh: tracer,
      direction
    });

    this.scene.add(tracer);
  }

  createMuzzleFlash() {
    if (this.gun) {
      const flash = new THREE.PointLight(0xffaa33, 10, 5);
      flash.position.set(0, 0.03, 0.22);
      this.gun.add(flash);
      setTimeout(() => {
        this.gun.remove(flash);
      }, 50);
    }
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
