export class AudioManager {
  static playShoot() {
    const audio = new Audio("/sounds/shoot.mp3");
    audio.play();
  }

  static playReload() {
    const audio = new Audio("/sounds/reload.mp3");
    audio.play();
  }
}
