import { _decorator, Component, Node, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("CameraFollow")
export class CameraFollow extends Component {
  @property({ type: Node })
  target: Node | null = null;

  @property
  followOffset: Vec3 = new Vec3(0, 0, 0);

  protected onLoad(): void {
    this.updatePosition();
  }

  update(deltaTime: number) {
    this.updatePosition();
  }

  private updatePosition() {
    if (!this.target) return;

    // 获取目标世界位置和朝向
    const targetPos = this.target.worldPosition;
    const forward = this.target.forward; // 面朝方向（单位向量）
    const up = new Vec3(0, 1, 0); // 向上单位向量（固定）

    // 根据角色方向计算身后方向
    const backOffset = forward.clone().multiplyScalar(-this.followOffset.z); // 后退
    const upOffset = up.clone().multiplyScalar(this.followOffset.y); // 上升
    const sideOffset = new Vec3(); // 可加横向偏移（如镜头偏右）

    const desiredPos = targetPos
      .clone()
      .add(backOffset)
      .add(upOffset)
      .add(sideOffset);

    // 设置相机位置
    this.node.setWorldPosition(desiredPos);

    // 让相机始终看向角色
    this.node.lookAt(targetPos);
  }
}
