import {
  _decorator,
  Component,
  Node,
  Prefab,
  Vec3,
  RenderableComponent,
  Color,
  instantiate,
} from "cc";
import { TileType, TurnDirection } from "./TileTypes";
import { Tile } from "./Tile";

const { ccclass, property } = _decorator;

@ccclass("MapGenerator")
export class MapGenerator extends Component {
  @property({ type: Prefab })
  tilePrefab: Prefab | null = null;

  @property
  tileLength: number = 5;

  @property
  preSpawnCount: number = 20;

  @property({ type: Node })
  player: Node | null = null;

  private _direction: Vec3 = new Vec3(0, 0, -1); // 默认向前（Z-）
  private _currentPos: Vec3 = new Vec3(0, 0, 0); // 当前生成位置

  private _tiles: Node[] = [];

  onLoad() {
    for (let i = 0; i < this.preSpawnCount; i++) {
      this.spawnTile();
    }
  }

  update(deltaTime: number) {
    if (!this.player) return;

    const playerPos = this.player.worldPosition;
    const distance = Vec3.distance(playerPos, this._currentPos);

    if (distance < 40) {
      this.spawnTile();
      this.recycleTile(); // 可选：回收旧地块
    }
  }

  reset() {
    this._tiles.forEach((tile) => tile.destroy());
    this._tiles = [];

    // ✅ 重置生成起点与方向
    this._currentPos.set(0, 0, 0);
    this._direction.set(0, 0, -1);

    for (let i = 0; i < this.preSpawnCount; i++) {
      this.spawnTile();
    }
  }

  private getRandomTileType(): TileType {
    const r = Math.random();
    if (r < 0.6) return TileType.NORMAL;
    if (r < 0.8) return TileType.GAP;
    return TileType.BUILDABLE;
  }

  private getRandomTurnDirection(): TurnDirection {
    const r = Math.random();
    if (r < 0.96) return TurnDirection.NONE;
    if (r < 0.98) return TurnDirection.LEFT;
    return TurnDirection.RIGHT;
  }

  private spawnTile() {
    if (!this.tilePrefab) return;

    const tile = instantiate(this.tilePrefab);
    tile.setParent(this.node);

    const tileScript = tile.getComponent(Tile);
    const tileType = this.getRandomTileType();
    const turnDirection = this.getRandomTurnDirection();

    tileScript.type = tileType;
    tileScript.turnDirection = turnDirection;

    // ✅ 设置地块位置
    tile.setWorldPosition(this._currentPos.clone());

    // ✅ 更新方向（先根据转向更新方向向量）
    switch (turnDirection) {
      case TurnDirection.LEFT:
        this._turnLeft();
        break;
      case TurnDirection.RIGHT:
        this._turnRight();
        break;
      default:
        // 不转向，方向不变
        break;
    }

    // ✅ 按当前方向推进下一块位置
    this._currentPos.add(
      this._direction.clone().multiplyScalar(this.tileLength)
    );

    // ✅ 根据类型处理显示
    switch (tileType) {
      case TileType.NORMAL:
        tile.active = true;
        break;
      case TileType.GAP:
        tile.active = false;
        break;
      case TileType.BUILDABLE:
        tile
          .getComponent(RenderableComponent)
          ?.material.setProperty("mainColor", new Color(255, 255, 0));
        break;
    }

    this._tiles.push(tile);
  }

  private _turnLeft() {
    if (this._direction.z !== 0) {
      this._direction = new Vec3(-this._direction.z, 0, 0); // Z± → X∓
    } else {
      this._direction = new Vec3(0, 0, this._direction.x); // X± → Z±
    }
  }

  private _turnRight() {
    if (this._direction.z !== 0) {
      this._direction = new Vec3(this._direction.z, 0, 0); // Z± → X±
    } else {
      this._direction = new Vec3(0, 0, -this._direction.x); // X± → Z∓
    }
  }

  private recycleTile() {
    if (this._tiles.length > this.preSpawnCount) {
      const oldTile = this._tiles.shift();
      oldTile?.destroy();
    }
  }
}
