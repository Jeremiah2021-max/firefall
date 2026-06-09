import * as THREE from "three";
import { HealthPack } from "./HealthPack.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.trees = [];
    this.rocks = [];
    this.healthPacks = [];

    this.createGround();
    this.createBuildings();
    this.spawnHealthPacks();
  }

  createGround() {
    // Create varied terrain with height - higher resolution
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 200, 200);
    const vertices = groundGeometry.attributes.position.array;
    
    // Add height variation for terrain with smoother hills
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      // Create smoother, more natural hills and valleys
      vertices[i + 1] = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3 + 
                       Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5 +
                       Math.random() * 0.3;
    }
    
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85,
      metalness: 0.05
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add water/river
    this.createWater();
  }

  createBuilding(x, z) {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(4, Math.random() * 8 + 3, 4),
      new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.8,
        metalness: 0.1
      }),
    );

    building.position.set(x, building.geometry.parameters.height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;

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
    
    // Add trees
    this.createTrees();
    
    // Add rocks
    this.createRocks();
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
    
    // Check buildings
    for (const building of this.buildings) {
      const box = new THREE.Box3().setFromObject(building);
      box.expandByScalar(playerRadius);
      if (box.containsPoint(position)) {
        return true;
      }
    }
    
    // Check trees (tree groups)
    for (const tree of this.trees) {
      const box = new THREE.Box3().setFromObject(tree);
      box.expandByScalar(playerRadius);
      if (box.containsPoint(position)) {
        return true;
      }
    }
    
    // Check rocks
    for (const rock of this.rocks) {
      const box = new THREE.Box3().setFromObject(rock);
      box.expandByScalar(playerRadius);
      if (box.containsPoint(position)) {
        return true;
      }
    }
    
    return false;
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90a4,
      roughness: 0.1,
      metalness: 0.3
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    this.scene.add(water);
  }

  createTrees() {
    for (let i = 0; i < 50; i++) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      this.createTree(x, z);
    }
  }

  createTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk - higher segment count
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 16);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Foliage layers - higher segment count for smoother cones
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.8
    });

    const foliage1 = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 16),
      foliageMaterial
    );
    foliage1.position.y = 3.5;
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    treeGroup.add(foliage1);

    const foliage2 = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 2.5, 16),
      foliageMaterial
    );
    foliage2.position.y = 5;
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    treeGroup.add(foliage2);

    const foliage3 = new THREE.Mesh(
      new THREE.ConeGeometry(1, 2, 16),
      foliageMaterial
    );
    foliage3.position.y = 6.5;
    foliage3.castShadow = true;
    foliage3.receiveShadow = true;
    treeGroup.add(foliage3);

    treeGroup.position.set(x, 0, z);
    
    // Random rotation for variety
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    
    this.scene.add(treeGroup);
    this.trees.push(treeGroup);
  }

  createRocks() {
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      this.createRock(x, z);
    }
  }

  createRock(x, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(
      0.5 + Math.random() * 1.5,
      1
    );
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b6b6b,
      roughness: 0.9,
      metalness: 0.1
    });

    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.5, z);
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);
    this.rocks.push(rock);
  }
}
