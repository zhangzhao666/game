import {
  _decorator,
  Component,
  input,
  Input,
  KeyCode,
  EventKeyboard,
  Vec3,
  RigidBody,
  PhysicsSystem,
  geometry,
  Collider,
  Node,
  EventTouch,
  view,
  Vec2,
} from "cc";
import { GameManager } from "./GameManager";
const { ccclass, property } = _decorator;
const { Ray } = geometry;

type TouchState = {
  startPos: Vec2;
  currentPos: Vec2;
  timeHeld: number;
  isSlide: boolean;
};

@ccclass("PlayerController")
export class PlayerController extends Component {
  @property
  moveSpeed: number = 5;

  @property
  jumpForce: number = 4;

  @property
  forwardSpeed: number = 8;

  @property({ type: Node })
  gameManager: Node | null = null;

  private _activeTouches: Map<number, TouchState> = new Map();
  private _longPressThreshold: number = 0.15; // 150ms
  private _swipeThreshold: number = 50; // 最小上划像素值
  private _targetRotationY: number = 0; // 目标角度
  private _rotationSpeed: number = 360; // 每秒最大旋转角度（度/秒）

  private _rigidBody: RigidBody | null = null;
  private _isGrounded: boolean = false;
  private _velocity: Vec3 = new Vec3();
  private _ray: geometry.Ray = new Ray();

  private _moveDirection: number = 0; // -1 左，1 右，0 停止
  private _jumpRequested: boolean = false; // 是否请求跳跃

  start() {
    this._rigidBody = this.getComponent(RigidBody);
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

    console.log("PlayerController initialized");
  }

  update(deltaTime: number) {
    this.checkGrounded();

    if (!this._rigidBody) return;

    // 🎯 分析触点：左/右长按是否生效
    let leftHeld = false;
    let rightHeld = false;
    const screenWidth = view.getVisibleSize().width;

    this._activeTouches.forEach((touch) => {
      touch.timeHeld += deltaTime;

      // 滑动跳跃的触点，不考虑左右方向控制
      if (touch.isSlide) return;

      if (touch.timeHeld >= this._longPressThreshold) {
        if (touch.startPos.x < screenWidth / 2) {
          leftHeld = true;
        } else {
          rightHeld = true;
        }
      }
    });

    // ✅ 判定最终移动方向
    if (leftHeld && !rightHeld) {
      this._moveDirection = -1;
    } else if (rightHeld && !leftHeld) {
      this._moveDirection = 1;
    } else {
      this._moveDirection = 0;
    }

    // 🚀 获取当前速度
    this._rigidBody.getLinearVelocity(this._velocity);

    // 设置跳跃（一次性）
    if (this._jumpRequested && this._isGrounded) {
      this._velocity.y = this.jumpForce;
      this._jumpRequested = false;
    }

    // 设置基础左右方向移动
    this._velocity.set(
      this._moveDirection * this.moveSpeed,
      this._velocity.y,
      0
    );

    // ✅ 添加角色“面朝方向”的前进速度（角色自动旋转后也能正常）
    const forward = this.node.forward.clone().multiplyScalar(this.forwardSpeed);
    this._velocity.add(forward);

    // 应用速度
    this._rigidBody.setLinearVelocity(this._velocity);

    // 平滑旋转角色朝向
    const currentY = this.node.eulerAngles.y;
    let angleDiff = this._targetRotationY - currentY;

    // 归一化角度差到 [-180, 180]
    angleDiff = ((((angleDiff + 180) % 360) + 360) % 360) - 180;

    const maxDelta = this._rotationSpeed * deltaTime;
    const appliedDelta =
      Math.abs(angleDiff) < maxDelta
        ? angleDiff
        : Math.sign(angleDiff) * maxDelta;

    const newY = currentY + appliedDelta;
    this.node.setRotationFromEuler(0, newY, 0);

    // 掉落检测（死亡处理）
    if (this.node.worldPosition.y < -0.2 && this.gameManager) {
      this.gameManager.getComponent(GameManager).onPlayerDie();
    }
  }

  reset() {
    this._activeTouches.clear();
    this._moveDirection = 0;
    this._jumpRequested = false;
    this._isGrounded = false;

    this.node.setRotationFromEuler(0, 0, 0);
    this._targetRotationY = 0;

    if (this._rigidBody) {
      this._velocity.set(0, 0, 0);
      this.node.setPosition(0, 1, 0);
    }
  }

  private _normalizeAngle(angle: number): number {
    return Math.round(angle / 90) * 90;
  }

  private onTouchStart(event: EventTouch) {
    const id = event.getID();
    const pos = event.getLocation();

    this._activeTouches.set(id, {
      startPos: pos.clone(),
      currentPos: pos.clone(),
      timeHeld: 0,
      isSlide: false,
    });
  }

  private onTouchMove(event: EventTouch) {
    const id = event.getID();
    const touch = this._activeTouches.get(id);
    if (!touch) return;

    const current = event.getLocation();
    touch.currentPos.set(current);

    const dx = current.x - touch.startPos.x;
    const dy = current.y - touch.startPos.y;

    if (!touch.isSlide) {
      if (dy > this._swipeThreshold) {
        touch.isSlide = true;
        if (this._isGrounded) this._jumpRequested = true;
      } else if (Math.abs(dx) > this._swipeThreshold) {
        touch.isSlide = true;
        if (dx > 0) {
          this.turnRight();
        } else {
          this.turnLeft();
        }
      }
    }
  }

  private onTouchEnd(event: EventTouch) {
    const id = event.getID();
    this._activeTouches.delete(id);
  }

  private turnLeft() {
    this._targetRotationY = this._normalizeAngle(this._targetRotationY + 90);
  }

  private turnRight() {
    this._targetRotationY = this._normalizeAngle(this._targetRotationY - 90);
  }

  private checkGrounded() {
    const origin = this.node.worldPosition.clone();
    const direction = new Vec3(0, -1, 0);

    this._ray.o.set(origin);
    this._ray.d.set(direction);

    const collider = this.node.getComponent(Collider);
    const halfHeight = collider ? collider.worldBounds.halfExtents.y : 0;

    const hit = PhysicsSystem.instance.raycastClosest(
      this._ray,
      0xffffffff,
      halfHeight + 0.05
    ); // 加一点安全空间
    this._isGrounded = !!hit;
  }
}
