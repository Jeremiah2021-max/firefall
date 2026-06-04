import * as THREE from "three";
import { Enemy } from "./Enemy.js";
import { ParticleSystem } from "../effects/ParticleSystem.js";

export class EnemyManager {
  constructor(scene, camera, world) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.enemies = [];
    this.bloodPools = [];
    this.enemyBullets = [];
    this.kills = 0;
    this.particleSystem = new ParticleSystem(scene);

    this.spawnInitialEnemies();
    this.setupSpawning();
  }

  spawnInitialEnemies() {
    for (let i = 0; i < 10; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 50,
      1,
      (Math.random() - 0.5) * 50
    );
    const enemy = new Enemy(this.scene, position, this.world);
    this.enemies.push(enemy);
  }

  setupSpawning() {
    setInterval(() => {
      this.spawnEnemy();
    }, 5000);
  }

  createBloodSplash(position) {
    this.particleSystem.spawnBloodParticles(position, 20);
  }

  createBloodPool(position) {
    const bloodPool = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0x8b0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      })
    );

    bloodPool.position.copy(position);
    bloodPool.position.y = 0.01;
    bloodPool.rotation.x = -Math.PI / 2;

    this.bloodPools.push({
      mesh: bloodPool,
      deathTime: Date.now()
    });

    this.scene.add(bloodPool);
  }

  createEnemyBullet(position, direction) {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff4444
      })
    );

    bullet.position.copy(position);

    this.enemyBullets.push({
      mesh: bullet,
      direction: direction
    });

    this.scene.add(bullet);
  }

  shootEnemy(enemy, playerPosition) {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.08),
      new THREE.MeshBasicMaterial({
        color: 0xff0000
      })
    );

    bullet.position.copy(enemy.mesh.position);

    const direction = new THREE.Vector3().subVectors(playerPosition, enemy.mesh.position);
    direction.normalize();

    this.enemyBullets.push({
      mesh: bullet,
      direction
    });

    this.scene.add(bullet);
  }

  updateEnemyBullets(playerPosition, player) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.mesh.position.add(bullet.direction.clone().multiplyScalar(0.5));

      // Check collision with player
      const distance = bullet.mesh.position.distanceTo(playerPosition);
      if (distance < 1) {
        this.scene.remove(bullet.mesh);
        this.enemyBullets.splice(i, 1);
        player.takeDamage(2);
        continue;
      }

      // Remove bullets that are too far
      if (bullet.mesh.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 200) {
        this.scene.remove(bullet.mesh);
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  update(playerPosition, player) {
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const shouldRemove = enemy.update(playerPosition);

      if (shouldRemove) {
        enemy.dispose();
        this.enemies.splice(i, 1);
        this.kills++;
      }

      // Enemy shooting based on distance
      const distance = enemy.mesh.position.distanceTo(playerPosition);
      if (distance < 15 && !enemy.dying) {
        const now = Date.now();
        if (now - enemy.lastShot > 1000) {
          this.shootEnemy(enemy, playerPosition);
          enemy.lastShot = now;
        }
      }

      // Enemy melee attack
      if (!enemy.dying && enemy.getDistanceTo(playerPosition) < 2) {
        const now = Date.now();
        if (now - player.lastAttack > 1000) {
          player.takeDamage(10);
        }
      }
    }

    // Update enemy bullets
    this.updateEnemyBullets(playerPosition, player);

    // Update particle system
    this.particleSystem.update();
    this.particleSystem.render();

    // Update blood pools
    for (let i = this.bloodPools.length - 1; i >= 0; i--) {
      const pool = this.bloodPools[i];
      const elapsed = Date.now() - pool.deathTime;
      
      // Fade out over the last second
      if (elapsed > 1000) {
        pool.mesh.material.opacity = Math.max(0, 0.8 - (elapsed - 1000) / 1000 * 0.8);
      }
      
      // Remove after 2 seconds
      if (elapsed > 2000) {
        this.scene.remove(pool.mesh);
        this.bloodPools.splice(i, 1);
      }
    }
  }

  checkBulletCollision(bulletPosition) {
    for (const enemy of this.enemies) {
      if (enemy.dying) continue;

      const distance = bulletPosition.distanceTo(enemy.mesh.position);
      if (distance < 1) {
        this.createBloodSplash(bulletPosition);

        // Show hitmarker
        const marker = document.getElementById("hitmarker");
        marker.style.display = "block";
        setTimeout(() => {
          marker.style.display = "none";
        }, 100);

        // Hit zone detection
        const headHeight = enemy.mesh.position.y + 1.1;
        const torsoBottom = enemy.mesh.position.y + 0.4;
        
        let damage;
        if (bulletPosition.y > headHeight) {
          // Headshot - 1 shot kill
          damage = 100;
        } else if (bulletPosition.y > torsoBottom) {
          // Torso - 2 shots to kill
          damage = 50;
        } else {
          // Limbs - lower damage
          damage = 25;
        }

        const wasAlive = enemy.health > 0;
        enemy.takeDamage(damage);
        
        // Check if enemy died from this hit
        if (wasAlive && enemy.health <= 0) {
          this.addKillFeedEntry(damage === 100);
          // Create blood pool when enemy dies
          this.createBloodPool(enemy.mesh.position);
        }
        
        return true;
      }
    }
    return false;
  }

  addKillFeedEntry(isHeadshot) {
    const killfeed = document.getElementById("killfeed");
    const entry = document.createElement("div");
    entry.className = "kill-entry";
    entry.textContent = isHeadshot ? "HEADSHOT!" : "Enemy killed";
    entry.style.color = isHeadshot ? "#ff4444" : "#ffffff";
    entry.style.fontWeight = isHeadshot ? "bold" : "normal";
    
    killfeed.appendChild(entry);
    
    // Remove after 5 seconds
    setTimeout(() => {
      entry.classList.add("fade-out");
      setTimeout(() => {
        if (entry.parentNode) {
          entry.parentNode.removeChild(entry);
        }
      }, 500);
    }, 5000);
  }
}
