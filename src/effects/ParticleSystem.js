import * as THREE from "three";

export class Particle {
  constructor(position, velocity, color, size, lifetime) {
    this.position = position.clone();
    this.velocity = velocity.clone();
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.gravity = new THREE.Vector3(0, -0.01, 0);
  }

  update() {
    this.velocity.add(this.gravity);
    this.position.add(this.velocity);
    this.lifetime--;
  }

  isDead() {
    return this.lifetime <= 0;
  }

  getOpacity() {
    return this.lifetime / this.maxLifetime;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawnParticle(position, velocity, color, size, lifetime) {
    const particle = new Particle(position, velocity, color, size, lifetime);
    this.particles.push(particle);
    return particle;
  }

  spawnBloodParticles(position, count = 20) {
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.25,
        (Math.random() - 0.5) * 0.3
      );
      // Vary blood color for more realistic look
      const colorVariation = Math.random();
      let color;
      if (colorVariation > 0.7) {
        color = 0x8b0000; // Dark red
      } else if (colorVariation > 0.4) {
        color = 0xff0000; // Bright red
      } else {
        color = 0xcc0000; // Medium red
      }
      const size = 0.04 + Math.random() * 0.06;
      const lifetime = 40 + Math.random() * 40;
      this.spawnParticle(position, velocity, color, size, lifetime);
    }
  }

  spawnExplosionParticles(position, count = 30) {
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        Math.random() * 0.6,
        (Math.random() - 0.5) * 0.6
      );
      // More varied explosion colors
      const colorVariation = Math.random();
      let color;
      if (colorVariation > 0.6) {
        color = 0xff6600; // Orange
      } else if (colorVariation > 0.3) {
        color = 0xffff00; // Yellow
      } else {
        color = 0xff3300; // Red-orange
      }
      const size = 0.12 + Math.random() * 0.2;
      const lifetime = 70 + Math.random() * 40;
      this.spawnParticle(position, velocity, color, size, lifetime);
    }
    
    // Add smoke particles after explosion
    this.spawnSmokeParticles(position, count / 2);
  }

  spawnSmokeParticles(position, count = 15) {
    for (let i = 0; i < count; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.1,
        (Math.random() - 0.5) * 0.05
      );
      const color = 0x555555;
      const size = 0.15 + Math.random() * 0.1;
      const lifetime = 60 + Math.random() * 30;
      const particle = this.spawnParticle(position, velocity, color, size, lifetime);
      particle.gravity.set(0, 0.005, 0); // Smoke rises
    }
  }

  spawnMuzzleFlashParticles(position, direction) {
    for (let i = 0; i < 8; i++) {
      const velocity = direction.clone().multiplyScalar(0.3 + Math.random() * 0.2);
      velocity.x += (Math.random() - 0.5) * 0.1;
      velocity.y += (Math.random() - 0.5) * 0.1;
      velocity.z += (Math.random() - 0.5) * 0.1;
      
      const color = Math.random() > 0.5 ? 0xffaa00 : 0xffff66;
      const size = 0.08 + Math.random() * 0.05;
      const lifetime = 5 + Math.random() * 5;
      this.spawnParticle(position, velocity, color, size, lifetime);
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();

      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    // Create or update particle meshes
    // For simplicity, we'll create simple sphere meshes for each particle
    // In a more optimized system, you'd use instanced meshes or points
    
    // Clear old particle meshes from scene
    // Note: This is a simple implementation. For production, use instanced meshes
    this.particles.forEach(particle => {
      if (!particle.mesh) {
        particle.mesh = new THREE.Mesh(
          new THREE.SphereGeometry(particle.size, 4, 4),
          new THREE.MeshBasicMaterial({
            color: particle.color,
            transparent: true,
            opacity: particle.getOpacity()
          })
        );
        particle.mesh.position.copy(particle.position);
        this.scene.add(particle.mesh);
      } else {
        particle.mesh.position.copy(particle.position);
        particle.mesh.material.opacity = particle.getOpacity();
      }
    });
  }

  dispose() {
    this.particles.forEach(particle => {
      if (particle.mesh) {
        this.scene.remove(particle.mesh);
      }
    });
    this.particles = [];
  }
}
