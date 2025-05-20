export enum TileType {
  NORMAL = 0,
  GAP = 1, // 缺口
  BUILDABLE = 2, // 可建造区域
  COLLECTIBLE = 3, // 道具区域
}

export enum TurnDirection {
  NONE = 0, // 向前
  LEFT = 1, // 向左
  RIGHT = 2, // 向右
}
