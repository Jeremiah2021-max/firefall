import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import { AudioManager } from "../audio/AudioManager.js";

export class Player {
  constructor(camera, scene, world) {
    this.camera = camera;
    this.scene = scene;
    this.world = world;

    this.health = 100;
    this.position = camera.position;
    this.y = 2;
    this.yVelocity = 0;
    this.grounded = true;
    this.lastAttack = 0;
    this.lastFootstep = 0;

    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false
    };

    this.controls = new PointerLockControls(camera, document.body);
    this.scene.add(this.controls.getObject());

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyW") this.keys.w = true;
      if (e.code === "KeyA") this.keys.a = true;
      if (e.code === "KeyS") this.keys.s = true;
      if (e.code === "KeyD") this.keys.d = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.keys.shift = true;
      if (e.code === "Space" && this.grounded) {
        this.yVelocity = 0.25;
        this.grounded = false;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.code === "KeyW") this.keys.w = false;
      if (e.code === "KeyA") this.keys.a = false;
      if (e.code === "KeyS") this.keys.s = false;
      if (e.code === "KeyD") this.keys.d = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.keys.shift = false;
    });
  }

  update() {
    const speed = this.keys.shift ? 0.25 : 0.12;

    const oldPosition = this.camera.position.clone();

    const isMoving = this.keys.w || this.keys.s || this.keys.a || this.keys.d;

    if (this.keys.w) {
      this.controls.moveForward(speed);
    }

    if (this.keys.s) {
      this.controls.moveForward(-speed);
    }

    if (this.keys.a) {
      this.controls.moveRight(-speed);
    }

    if (this.keys.d) {
      this.controls.moveRight(speed);
    }

    if (this.world.checkCollision(this.camera.position)) {
      this.camera.position.copy(oldPosition);
    }

    this.yVelocity -= 0.01;
    this.y += this.yVelocity;

    if (this.y <= 2) {
      this.y = 2;
      this.grounded = true;
      this.yVelocity = 0;
    }

    this.camera.position.y = this.y;

    // Play footstep sound when moving and grounded
    if (isMoving && this.grounded) {
      const now = Date.now();
      const footstepInterval = this.keys.shift ? 250 : 400;
      if (now - this.lastFootstep > footstepInterval) {
        AudioManager.playFootstep();
        this.lastFootstep = now;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    const now = Date.now();
    this.lastAttack = now;
  }
}
