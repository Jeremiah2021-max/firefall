import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";
import { Player } from "../player/Player.js";
import { EnemyManager } from "../enemy/EnemyManager.js";
import { World } from "../world/World.js";
import { UI } from "../ui/UI.js";
import { AudioManager } from "../audio/AudioManager.js";
import { Rifle } from "../weapons/Rifle.js";
import { Pistol } from "../weapons/Pistol.js";
import { Grenade } from "../weapons/Grenade.js";

export class Game {
  constructor() {
    this.scene = new THREE.Scene();

    // Load skybox
    const loader = new THREE.CubeTextureLoader();
    this.scene.background = loader.load([
      "/skybox/px.jpg",
      "/skybox/nx.jpg",
      "/skybox/py.jpg",
      "/skybox/ny.jpg",
      "/skybox/pz.jpg",
      "/skybox/nz.jpg"
    ]);

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
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 2, 5);

    this.setupLights();
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.scene, this.world);
    this.enemyManager = new EnemyManager(this.scene, this.camera, this.world);
    this.ui = new UI();
    this.audioManager = new AudioManager();
    
    this.rifle = new Rifle();
    this.pistol = new Pistol();
    this.currentWeapon = this.rifle;
    this.currentWeapon.initialize(this.camera, this.scene);

    this.grenade = new Grenade(this.scene, this.camera, this.enemyManager.particleSystem);

    this.baseFOV = 75;
    this.currentFOV = this.baseFOV;

    this.setupEventListeners();
    this.setupResizeHandler();

    this.isRunning = true;
    this.timeOfDay = 0;
  }

  setupLights() {
    // Main directional light (sun) with shadows
    this.sun = new THREE.DirectionalLight(0xffffff, 1.5);
    this.sun.position.set(50, 100, 50);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    this.sun.shadow.bias = -0.0001;
    this.scene.add(this.sun);

    // Hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.4);
    this.scene.add(hemiLight);

    // Ambient light for fill
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Add fog for depth
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
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
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        // Reset zoom to min when running
        this.currentWeapon.zoomLevel = this.currentWeapon.minZoom;
      }
      if (e.key.toLowerCase() === "g") {
        this.grenade.throw();
      }
    });

    document.addEventListener("wheel", (e) => {
      if (this.player.controls.isLocked) {
        const zoomSpeed = 0.1;
        if (e.deltaY < 0) {
          // Scroll up - zoom in
          this.currentWeapon.zoomLevel = Math.min(
            this.currentWeapon.maxZoom,
            this.currentWeapon.zoomLevel + zoomSpeed
          );
        } else {
          // Scroll down - zoom out
          this.currentWeapon.zoomLevel = Math.max(
            this.currentWeapon.minZoom,
            this.currentWeapon.zoomLevel - zoomSpeed
          );
        }
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

    // Reset zoom when switching weapons
    this.currentWeapon.zoomLevel = 1;
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
    
    // Update grenade
    this.grenade.update();
    if (this.grenade.exploded) {
      this.grenade.checkDamage(this.player.position, this.enemyManager.enemies);
      this.grenade.dispose();
    }
    
    // Check health pack collision
    const healAmount = this.world.checkHealthPackCollision(this.player.position);
    if (healAmount > 0) {
      this.player.health = Math.min(100, this.player.health + healAmount);
      AudioManager.playHealth();
      const healthGlow = document.getElementById('health-glow');
      if (healthGlow) {
        healthGlow.classList.add('active');
        setTimeout(() => {
          healthGlow.classList.remove('active');
        }, 3000);
      }
    }
    
    // Update camera FOV based on zoom level
    const targetFOV = this.baseFOV / this.currentWeapon.zoomLevel;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, 0.1);
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();
    
    // Update crosshair based on zoom level
    this.ui.updateCrosshair(this.currentWeapon.zoomLevel);
    
    // Update weapon zoom level for gun positioning
    this.currentWeapon.zoomLevel = this.currentWeapon.zoomLevel;
    
    this.ui.update(this.player.health, this.currentWeapon.ammo, this.currentWeapon.reserveAmmo, this.enemyManager.kills);

    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  updateDayNightCycle() {
    this.timeOfDay += 0.00005;

    this.sun.position.x = Math.sin(this.timeOfDay) * 100;
    this.sun.position.y = Math.cos(this.timeOfDay) * 100;

    this.sun.intensity = Math.max(0.2, this.sun.position.y / 100);
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
      this.updateDayNightCycle();
    };
    animate();
  }
}
