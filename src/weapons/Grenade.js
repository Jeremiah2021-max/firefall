import * as THREE from "three";
import { AudioManager } from "../audio/AudioManager.js";

export class Grenade {
  constructor(scene, camera, particleSystem) {
    this.scene = scene;
    this.camera = camera;
    this.particleSystem = particleSystem;
    this.mesh = null;
    this.velocity = new THREE.Vector3();
    this.gravity = new THREE.Vector3(0, -0.015, 0);
    this.active = false;
    this.exploded = false;
    this.explosionTime = 0;
    this.damageRadius = 5;
    this.explosionPosition = null;
  }

  throw() {
    if (this.active || this.exploded) return;

    // Create grenade mesh
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x2f4f2f
      })
    );

    // Position at camera
    this.mesh.position.copy(this.camera.position);

    // Calculate throw direction and velocity
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    // Add upward arc to throw
    direction.y += 0.3;
    direction.normalize();

    this.velocity = direction.multiplyScalar(0.3);

    this.scene.add(this.mesh);
    this.active = true;
    this.exploded = false;
    this.explosionTime = Date.now() + 3000; // 3 seconds

    AudioManager.playThrow();
  }

  update() {
    if (!this.active || this.exploded) return;

    // Apply physics
    this.velocity.add(this.gravity);
    this.mesh.position.add(this.velocity);

    // Ground collision with bounce
    if (this.mesh.position.y <= 0.1) {
      this.mesh.position.y = 0.1;
      this.velocity.y *= -0.5; // Bounce with energy loss
      this.velocity.x *= 0.7; // Friction
      this.velocity.z *= 0.7;
    }

    // Check if it's time to explode
    if (Date.now() >= this.explosionTime) {
      this.explode();
    }
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.active = false;

    // Store explosion position before removing mesh
    this.explosionPosition = this.mesh.position.clone();

    // Create explosion effects
    this.createExplosionEffects();

    // Remove grenade mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
  }

  createExplosionEffects() {
    const position = this.explosionPosition || (this.mesh ? this.mesh.position : new THREE.Vector3());

    // Particle explosion
    this.particleSystem.spawnExplosionParticles(position, 200);

    // Light flash
    const flash = new THREE.PointLight(0xff6600, 80, 30);
    flash.position.copy(position);
    this.scene.add(flash);

    // Fade out flash
    let flashIntensity = 80;
    const fadeInterval = setInterval(() => {
      flashIntensity -= 3;
      flash.intensity = flashIntensity;
      if (flashIntensity <= 0) {
        this.scene.remove(flash);
        clearInterval(fadeInterval);
      }
    }, 50);

    // Play explosion sound
    AudioManager.playExplosion();
  }

  checkDamage(playerPosition, enemies) {
    if (!this.exploded || !this.explosionPosition) return;

    const explosionPosition = this.explosionPosition;

    // Damage player if in radius
    const playerDistance = explosionPosition.distanceTo(playerPosition);
    if (playerDistance <= this.damageRadius) {
      const damage = Math.floor(50 * (1 - playerDistance / this.damageRadius));
      // Player damage would be handled here if needed
    }

    // Damage enemies in radius
    enemies.forEach(enemy => {
      if (enemy.dying) return;
      const enemyDistance = explosionPosition.distanceTo(enemy.mesh.position);
      if (enemyDistance <= this.damageRadius) {
        const damage = Math.floor(100 * (1 - enemyDistance / this.damageRadius));
        enemy.takeDamage(damage);
      }
    });
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
    this.active = false;
    this.exploded = false;
    this.explosionPosition = null;
  }
}
