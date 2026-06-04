import * as THREE from "three";
import { Enemy } from "./Enemy.js";

export class EnemyManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.enemies = [];
    this.bloodParticles = [];
    this.enemyBullets = [];
    this.kills = 0;

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
    const enemy = new Enemy(this.scene, position);
    this.enemies.push(enemy);
  }

  setupSpawning() {
    setInterval(() => {
      this.spawnEnemy();
    }, 5000);
  }

  createBloodSplash(position) {
    for (let i = 0; i < 15; i++) {
      const blood = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 4, 4),
        new THREE.MeshBasicMaterial({
          color: 0xff0000
        })
      );

      blood.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.1
      );

      this.bloodParticles.push({
        mesh: blood,
        velocity: velocity,
        life: 1.0
      });

      this.scene.add(blood);
    }
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

    // Update blood particles
    for (let i = this.bloodParticles.length - 1; i >= 0; i--) {
      const blood = this.bloodParticles[i];
      blood.velocity.y -= 0.01;
      blood.mesh.position.add(blood.velocity);
      blood.life -= 0.02;

      if (blood.mesh.position.y <= 0) {
        blood.mesh.position.y = 0;
        blood.velocity.set(0, 0, 0);
      }

      if (blood.life <= 0) {
        this.scene.remove(blood.mesh);
        this.bloodParticles.splice(i, 1);
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

        // Headshot detection
        const headHeight = enemy.mesh.position.y + 1.1;
        const isHeadshot = bulletPosition.y > headHeight;
        const damage = isHeadshot ? 100 : 50;

        const wasAlive = enemy.health > 0;
        enemy.takeDamage(damage);
        
        // Check if enemy died from this hit
        if (wasAlive && enemy.health <= 0) {
          this.addKillFeedEntry(isHeadshot);
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
