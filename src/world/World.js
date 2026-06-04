import * as THREE from "three";
import { HealthPack } from "./HealthPack.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.healthPacks = [];

    this.createGround();
    this.createBuildings();
    this.spawnHealthPacks();
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0xc2b280,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  createBuilding(x, z) {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(4, Math.random() * 8 + 3, 4),
      new THREE.MeshLambertMaterial({
        color: 0x8b7355,
      }),
    );

    building.position.set(x, building.geometry.parameters.height / 2, z);

    this.scene.add(building);
    this.buildings.push(building);
  }

  createBuildings() {
    for (let i = 0; i < 40; i++) {
      this.createBuilding(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
    }
  }

  spawnHealthPacks() {
    for (let i = 0; i < 5; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        1,
        (Math.random() - 0.5) * 80
      );
      this.healthPacks.push(new HealthPack(this.scene, position));
    }
  }

  checkHealthPackCollision(playerPosition) {
    for (let i = this.healthPacks.length - 1; i >= 0; i--) {
      const healthPack = this.healthPacks[i];
      if (healthPack.checkCollision(playerPosition)) {
        const healAmount = healthPack.healAmount;
        healthPack.dispose();
        this.healthPacks.splice(i, 1);
        return healAmount;
      }
    }
    return 0;
  }

  respawnHealthPack() {
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 80,
      1,
      (Math.random() - 0.5) * 80
    );
    this.healthPacks.push(new HealthPack(this.scene, position));
  }

  checkCollision(position) {
    const playerRadius = 0.5;
    for (const building of this.buildings) {
      const box = new THREE.Box3().setFromObject(building);
      box.expandByScalar(playerRadius);
      if (box.containsPoint(position)) {
        return true;
      }
    }
    return false;
  }
}
