import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {

    @property({ type: Node })
    target: Node | null = null;

    @property
    followOffset: Vec3 = new Vec3(0, 5, -10);

    private _targetPos: Vec3 = new Vec3();
    private _desiredPos: Vec3 = new Vec3();

    update(deltaTime: number) {
        if (!this.target) return;

        this._targetPos.set(this.target.worldPosition);
        this._desiredPos.set(
            this._targetPos.x + this.followOffset.x,
            this._targetPos.y + this.followOffset.y,
            this._targetPos.z + this.followOffset.z
        );

        this.node.setWorldPosition(this._desiredPos);
    }
}
