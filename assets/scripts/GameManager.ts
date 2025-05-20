import { _decorator, Component, Node, director, Vec3 } from "cc";
import { MapGenerator } from "./MapGenerator";
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

@ccclass("GameManager")
export class GameManager extends Component {
  @property({ type: Node })
  player: Node | null = null;

  @property({ type: Node })
  startUI: Node | null = null;

  @property({ type: Node })
  gameOverUI: Node | null = null;

  @property({ type: MapGenerator })
  mapGenerator: MapGenerator | null = null;

  static instance: GameManager;

  private _gameStarted = false;

  onLoad() {
    GameManager.instance = this;
  }

  start() {
    this.player!.active = false;
    this.startUI!.active = true;
    this.gameOverUI!.active = false;
  }

  onStartButtonClick() {
    this._gameStarted = true;
    this.player!.active = true;
    this.startUI!.active = false;
    this.gameOverUI!.active = false;
  }

  onPlayerDie() {
    this._gameStarted = false;
    this.player!.active = false;
    this.gameOverUI!.active = true;
  }

  onRestartButtonClick() {
    // 重置角色位置
    this.player.active = true;
    this.player?.getComponent(PlayerController).reset();

    // 清空地图 & 重新生成（你可以调用 MapGenerator 中的重置逻辑）
    this.mapGenerator.reset();
    

    // 隐藏 Game Over 界面，显示 Start UI
    this.gameOverUI.active = false;
    this.startUI.active = false;

    // 重置其他游戏状态（如分数、速度等）
  }
}
