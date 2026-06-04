import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import { Player } from "../player/Player.js";
import { EnemyManager } from "../enemy/EnemyManager.js";
import { World } from "../world/World.js";
import { UI } from "../ui/UI.js";
import { AudioManager } from "../audio/AudioManager.js";
import { Rifle } from "../weapons/Rifle.js";
import { Pistol } from "../weapons/Pistol.js";

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2d1a00);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 2, 5);

    this.setupLights();
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.scene, this.world);
    this.enemyManager = new EnemyManager(this.scene, this.camera);
    this.ui = new UI();
    this.audioManager = new AudioManager();
    
    this.rifle = new Rifle();
    this.pistol = new Pistol();
    this.currentWeapon = this.rifle;
    this.currentWeapon.initialize(this.camera, this.scene);

    this.setupEventListeners();
    this.setupResizeHandler();

    this.isRunning = true;
  }

  setupLights() {
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
  }

  setupEventListeners() {
    document.addEventListener("click", () => {
      if (this.player.controls.isLocked) {
        this.currentWeapon.shoot();
      } else {
        this.player.controls.lock();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "r") {
        this.currentWeapon.reload();
      }
      if (e.key === "1") {
        this.switchWeapon(this.rifle);
      }
      if (e.key === "2") {
        this.switchWeapon(this.pistol);
      }
    });
  }

  switchWeapon(newWeapon) {
    if (this.currentWeapon === newWeapon) return;
    
    // Remove current weapon gun from camera
    if (this.currentWeapon.gun) {
      this.camera.remove(this.currentWeapon.gun);
    }
    
    this.currentWeapon = newWeapon;
    
    // Initialize new weapon
    if (!this.currentWeapon.gun) {
      this.currentWeapon.initialize(this.camera, this.scene);
    } else {
      this.camera.add(this.currentWeapon.gun);
      this.currentWeapon.gun.position.set(0.35, -0.25, -0.8);
    }
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  update() {
    this.player.update();
    this.currentWeapon.update();
    this.currentWeapon.checkCollision(this.enemyManager);
    this.enemyManager.update(this.player.position, this.player);
    
    // Check health pack collision
    const healAmount = this.world.checkHealthPackCollision(this.player.position);
    if (healAmount > 0) {
      this.player.health = Math.min(100, this.player.health + healAmount);
    }
    
    this.ui.update(this.player.health, this.currentWeapon.ammo, this.currentWeapon.reserveAmmo, this.enemyManager.kills);

    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  gameOver() {
    this.isRunning = false;
    alert(`Game Over!\nKills: ${this.enemyManager.kills}`);
    location.reload();
  }

  start() {
    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }
}
