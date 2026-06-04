export class AudioManager {
  static playShoot() {
    const audio = new Audio("/sounds/shoot.mp3");
    audio.play();
  }
}
