import * as THREE from "three";
import { AudioManager } from "../audio/AudioManager.js";

export class Weapon {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.name = "Weapon";
    this.damage = 10;
    this.magazine = 10;
    this.reserveAmmo = 50;
    this.ammo = this.magazine;
    this.reloading = false;
    this.bullets = [];
    this.gun = null;
    this.recoilX = 0;
    this.recoilY = 0;
    this.recoilRecovery = 0.95;
  }

  initialize(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.gun = this.createGun();
    this.camera.add(this.gun);
    this.gun.position.set(0.35, -0.25, -0.8);
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

  shoot() {
    if (this.ammo <= 0 || this.reloading) return;
    this.ammo--;
    AudioManager.playShoot();
    this.createBullet();
    this.applyRecoil();
  }

  createBullet() {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
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

  applyRecoil() {
    if (this.gun) {
      // Add random recoil pattern
      this.recoilX += (Math.random() - 0.5) * 0.02;
      this.recoilY += 0.05 + Math.random() * 0.03;
      
      this.gun.position.z += 0.1;
      this.gun.rotation.x += this.recoilY;
      this.gun.rotation.y += this.recoilX;
    }
  }

  updateRecoil() {
    if (this.gun) {
      // Recover from recoil
      this.recoilX *= this.recoilRecovery;
      this.recoilY *= this.recoilRecovery;
      
      this.gun.rotation.x = this.recoilY;
      this.gun.rotation.y = this.recoilX;
      
      // Reset position
      this.gun.position.z = THREE.MathUtils.lerp(this.gun.position.z, -0.8, 0.2);
    }
  }

  reload() {
    if (this.reloading || this.reserveAmmo <= 0) return;

    this.reloading = true;

    setTimeout(() => {
      const needed = this.magazine - this.ammo;
      const loaded = Math.min(needed, this.reserveAmmo);

      this.ammo += loaded;
      this.reserveAmmo -= loaded;

      this.reloading = false;
    }, 1500);
  }

  update() {
    this.updateRecoil();
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(2));

      // Remove bullets that are too far
      if (bullet.mesh.position.distanceTo(this.camera.position) > 200) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  checkCollision(enemyManager) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      const hit = enemyManager.checkBulletCollision(bullet.mesh.position);

      if (hit) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }
}
