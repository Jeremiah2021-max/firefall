import { Game } from "./core/Game.js";
import "./style.css";

let game = null;

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  game = new Game();
  game.start();
});
