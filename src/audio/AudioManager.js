export class AudioManager {
  static playShoot() {
    const audio = new Audio("/sounds/shoot.mp3");
    audio.play();
  }

  static playReload() {
    const audio = new Audio("/sounds/reload.mp3");
    audio.play();
  }

  static playEmpty() {
    const audio = new Audio("/sounds/empty.mp3");
    audio.play();
  }

  static playFootstep() {
    const audio = new Audio("/sounds/footstep.mp3");
    audio.play();
  }

  static playThrow() {
    const audio = new Audio("/sounds/throw.mp3");
    audio.play();
  }

  static playExplosion() {
    const audio = new Audio("/sounds/grenade.mp3");
    audio.play();
  }

  static playHealth() {
    const audio = new Audio("/sounds/health.mp3");
    audio.play();
  }
}
