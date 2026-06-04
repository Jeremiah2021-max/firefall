import * as THREE from "three";

export class HealthPack {
  constructor(scene, position) {
    this.scene = scene;
    this.healAmount = 25;
    this.mesh = this.createMesh();
    this.mesh.position.copy(position);
    scene.add(this.mesh);
    this.animate();
  }

  createMesh() {
    const group = new THREE.Group();

    // Cross shape
    const horizontal = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 0.2),
      new THREE.MeshBasicMaterial({
        color: 0xff0000
      })
    );

    const vertical = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      new THREE.MeshBasicMaterial({
        color: 0xff0000
      })
    );

    group.add(horizontal);
    group.add(vertical);

    return group;
  }

  animate() {
    const startY = this.mesh.position.y;
    const animate = () => {
      if (!this.mesh || !this.mesh.parent) return;
      this.mesh.position.y = startY + Math.sin(Date.now() * 0.003) * 0.2;
      this.mesh.rotation.y += 0.02;
      requestAnimationFrame(animate);
    };
    animate();
  }

  checkCollision(playerPosition) {
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance < 1.5;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
