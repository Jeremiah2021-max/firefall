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

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.5),
      new THREE.MeshLambertMaterial({
        color: 0x556b2f
      })
    );
    body.position.y = 0.7;

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshLambertMaterial({
        color: 0xffd39b
      })
    );
    head.position.y = 1.3;

    // Left Arm
    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.6, 0.2),
      new THREE.MeshLambertMaterial({
        color: 0x556b2f
      })
    );
    leftArm.position.set(-0.55, 0.6, 0);

    // Right Arm
    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.6, 0.2),
      new THREE.MeshLambertMaterial({
        color: 0x556b2f
      })
    );
    rightArm.position.set(0.55, 0.6, 0);

    // Left Leg
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.6, 0.25),
      new THREE.MeshLambertMaterial({
        color: 0x3d4a2f
      })
    );
    leftLeg.position.set(-0.2, 0.15, 0);

    // Right Leg
    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.6, 0.25),
      new THREE.MeshLambertMaterial({
        color: 0x3d4a2f
      })
    );
    rightLeg.position.set(0.2, 0.15, 0);

    enemyGroup.add(body);
    enemyGroup.add(head);
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
      this.rotationVelocity = 0.05;
    }
  }

  update(playerPosition) {
    if (this.dying) {
      this.mesh.rotation.x += this.rotationVelocity;
      this.mesh.position.y -= 0.02;
      return this.mesh.position.y <= 0;
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
