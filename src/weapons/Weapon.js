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
    this.zoomLevel = 1;
    this.impacts = [];
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

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.9),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.6,
        metalness: 0.4
      })
    );

    // Barrel - higher segment count
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.6
      })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, 0.65);

    // Handle/grip
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.28, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x3d3d3d,
        roughness: 0.7,
        metalness: 0.3
      })
    );
    handle.position.set(0, -0.18, -0.15);
    handle.rotation.x = 0.2;

    // Magazine
    const magazine = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.5,
        metalness: 0.5
      })
    );
    magazine.position.set(0, -0.15, 0.1);

    // Sight
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.3,
        metalness: 0.7
      })
    );
    sight.position.set(0, 0.11, 0.3);

    // Stock
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.16, 0.25),
      new THREE.MeshStandardMaterial({
        color: 0x3d3d3d,
        roughness: 0.7,
        metalness: 0.3
      })
    );
    stock.position.set(0, -0.05, -0.55);

    gunGroup.add(body);
    gunGroup.add(barrel);
    gunGroup.add(handle);
    gunGroup.add(magazine);
    gunGroup.add(sight);
    gunGroup.add(stock);

    return gunGroup;
  }

  shoot() {
    if (this.reloading) return;
    if (this.ammo <= 0) {
      AudioManager.playEmpty();
      return;
    }
    this.ammo--;
    AudioManager.playShoot();
    this.createMuzzleFlash();
    this.createBullet();
    this.applyRecoil();
  }

  createMuzzleFlash() {
    if (this.gun) {
      const flash = new THREE.PointLight(0xffaa33, 10, 5);
      flash.position.set(0, 0.05, 0.55);
      this.gun.add(flash);
      setTimeout(() => {
        this.gun.remove(flash);
      }, 50);
    }
  }

  createBullet() {
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
    AudioManager.playReload();

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
    this.updateGunPosition();
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(2));

      // Check for wall collision
      if (bullet.mesh.position.y <= 0) {
        this.createImpact(bullet.mesh.position);
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      // Remove bullets that are too far
      if (bullet.mesh.position.distanceTo(this.camera.position) > 200) {
        this.scene.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // Update impacts
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const impact = this.impacts[i];
      impact.life -= 16;
      impact.mesh.material.opacity = impact.life / 300;

      if (impact.life <= 0) {
        this.scene.remove(impact.mesh);
        this.impacts.splice(i, 1);
      }
    }
  }

  updateGunPosition() {
    if (this.gun) {
      const targetX = this.zoomLevel > 1.5 ? 0 : 0.35;
      const targetY = this.zoomLevel > 1.5 ? -0.35 : -0.25;
      const targetZ = this.zoomLevel > 1.5 ? -0.6 : -0.8;

      this.gun.position.x = THREE.MathUtils.lerp(this.gun.position.x, targetX, 0.1);
      this.gun.position.y = THREE.MathUtils.lerp(this.gun.position.y, targetY, 0.1);
      this.gun.position.z = THREE.MathUtils.lerp(this.gun.position.z, targetZ, 0.1);
    }
  }

  createImpact(position) {
    const impact = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      })
    );

    impact.position.copy(position);
    this.impacts.push({
      mesh: impact,
      life: 300
    });

    this.scene.add(impact);
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
