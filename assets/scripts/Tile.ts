import { _decorator, Component, Enum } from 'cc';
import { TileType, TurnDirection } from './TileTypes';

const { ccclass, property } = _decorator;

@ccclass('Tile')
export class Tile extends Component {

  @property({ type: Enum(TileType) })
  type: TileType = TileType.NORMAL;

  @property({ type: Enum(TurnDirection) })
  turnDirection: TurnDirection = TurnDirection.NONE;
}
