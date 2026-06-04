import * as THREE from "three";

export class Enemy {
  constructor(scene, position) {
    this.scene = scene;
    this.mesh = this.createMesh();
    this.mesh.position.copy(position);
    scene.add(this.mesh);
    
    this.health = 100;
    this.dying = false;
    this.rotationVelocity = 0;
    this.lastAttack = 0;
    this.lastShot = 0;
    this.detectionRadius = 15;
    this.shootCooldown = 2000;
    this.state = "patrol";
    this.speed = 0.03;
    this.patrolWaypoints = this.generatePatrolWaypoints(position);
    this.currentWaypointIndex = 0;
    this.patrolSpeed = 0.03;
    this.chaseSpeed = 0.05;
    this.deathTime = 0;
    this.fallDirection = new THREE.Vector3();
  }

  generatePatrolWaypoints(startPosition) {
    const waypoints = [];
    const numWaypoints = 3;
    
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i / numWaypoints) * Math.PI * 2;
      const radius = 10;
      const waypoint = new THREE.Vector3(
        startPosition.x + Math.cos(angle) * radius,
        1,
        startPosition.z + Math.sin(angle) * radius
      );
      waypoints.push(waypoint);
    }
    
    return waypoints;
  }

  createMesh() {
    const enemyGroup = new THREE.Group();

    // Zombie skin color (pale/greenish)
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b9d83,
      roughness: 0.8
    });

    // Tattered clothing color
    const clothesMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5d4a,
      roughness: 0.9
    });

    // Body (larger, more hunched) - use rounded box for higher fidelity
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.0, 0.6),
      clothesMaterial
    );
    body.position.y = 0.9;
    body.rotation.x = 0.1; // Slight hunch
    body.castShadow = true;
    body.receiveShadow = true;

    // Head (larger, zombie-like) - use rounded box
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.6, 0.55),
      skinMaterial
    );
    head.position.y = 1.6;
    head.castShadow = true;
    head.receiveShadow = true;

    // Eyes (glowing red)
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000
    });
    const leftEye = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.05),
      eyeMaterial
    );
    leftEye.position.set(-0.12, 1.65, 0.28);

    const rightEye = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.05),
      eyeMaterial
    );
    rightEye.position.set(0.12, 1.65, 0.28);

    // Left Arm (extended, zombie reach) - use rounded box
    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      skinMaterial
    );
    leftArm.position.set(-0.65, 0.7, 0.2);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;

    // Right Arm (extended) - use rounded box
    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      skinMaterial
    );
    rightArm.position.set(0.65, 0.7, 0.2);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;

    // Left Leg (slightly dragging) - use rounded box
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.7, 0.3),
      clothesMaterial
    );
    leftLeg.position.set(-0.25, 0.1, 0.1);
    leftLeg.rotation.z = 0.1;
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;

    // Right Leg - use rounded box
    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.7, 0.3),
      clothesMaterial
    );
    rightLeg.position.set(0.25, 0.1, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;

    enemyGroup.add(body);
    enemyGroup.add(head);
    enemyGroup.add(leftEye);
    enemyGroup.add(rightEye);
    enemyGroup.add(leftArm);
    enemyGroup.add(rightArm);
    enemyGroup.add(leftLeg);
    enemyGroup.add(rightLeg);

    return enemyGroup;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0 && !this.dying) {
      this.dying = true;
      this.deathTime = Date.now();
      // Determine fall direction based on current facing direction
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.mesh.quaternion);
      this.fallDirection.copy(forward);
    }
  }

  update(playerPosition) {
    if (this.dying) {
      // Fall forward in the direction they were facing (only while in the air)
      if (this.mesh.position.y > 0) {
        this.mesh.position.y -= 0.03;
        this.mesh.position.add(this.fallDirection.clone().multiplyScalar(0.02));
        
        // Rotate to lie flat on ground
        if (this.mesh.position.y > 0.5) {
          this.mesh.rotation.x += 0.05;
        }
      } else {
        this.mesh.position.y = 0;
        this.mesh.rotation.x = Math.PI / 2;
      }
      
      // Check if 2 seconds have passed since death
      return Date.now() - this.deathTime > 2000;
    }

    const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);

    // State management
    if (distanceToPlayer < this.detectionRadius) {
      if (distanceToPlayer < 5) {
        this.state = "attack";
      } else {
        this.state = "chase";
      }
    } else {
      this.state = "patrol";
    }

    // Behavior based on state
    switch (this.state) {
      case "patrol":
        this.patrol();
        break;
      case "chase":
        this.chase(playerPosition);
        break;
      case "attack":
        this.attack(playerPosition);
        break;
    }

    return false;
  }

  patrol() {
    const targetWaypoint = this.patrolWaypoints[this.currentWaypointIndex];
    const direction = new THREE.Vector3().subVectors(targetWaypoint, this.mesh.position);
    direction.y = 0;
    
    if (direction.length() < 1) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
    } else {
      direction.normalize();
      this.mesh.position.add(direction.multiplyScalar(this.patrolSpeed));
      this.mesh.lookAt(targetWaypoint);
    }
  }

  chase(playerPosition) {
    const direction = new THREE.Vector3().subVectors(playerPosition, this.mesh.position);
    direction.y = 0;
    direction.normalize();
    this.mesh.position.add(direction.multiplyScalar(this.chaseSpeed));
    this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
  }

  attack(playerPosition) {
    this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
    
    const now = Date.now();
    if (now - this.lastShot > this.shootCooldown) {
      this.shoot(playerPosition);
      this.lastShot = now;
    }
  }

  shoot(playerPosition) {
    // This will be handled by EnemyManager to create enemy bullets
    return {
      position: this.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
      direction: new THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize()
    };
  }

  getDistanceTo(position) {
    return this.mesh.position.distanceTo(position);
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
