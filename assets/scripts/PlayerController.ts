import { _decorator, Component, input, Input, KeyCode, EventKeyboard, Vec3, RigidBody, PhysicsSystem, geometry, Collider } from 'cc';
const { ccclass, property } = _decorator;
const { Ray } = geometry;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property
    moveSpeed: number = 5;

    @property
    jumpForce: number = 8;

    private _rigidBody: RigidBody | null = null;
    private _isGrounded: boolean = false;
    private _velocity: Vec3 = new Vec3();
    private _ray: geometry.Ray = new Ray();

    start() {
        this._rigidBody = this.getComponent(RigidBody);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        console.log('Physics running:', PhysicsSystem.instance.enable);

        console.log('PlayerController initialized');
    }

    update(deltaTime: number) {
        this.checkGrounded();
    }

    private onKeyDown(event: EventKeyboard) {
        if (!this._rigidBody) return;

        this._rigidBody.getLinearVelocity(this._velocity);

        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
                this._velocity.x = -this.moveSpeed;
                break;
            case KeyCode.ARROW_RIGHT:
                this._velocity.x = this.moveSpeed;
                break;
            case KeyCode.SPACE:
                if (this._isGrounded) {
                    this._velocity.y = this.jumpForce;
                }
                break;
        }

        this._rigidBody.setLinearVelocity(this._velocity);
    }

    private checkGrounded() {
        const origin = this.node.worldPosition.clone();
        const direction = new Vec3(0, -1, 0);

        // 正确方式：使用 Ray 类实例，并赋值属性 o 和 d
        this._ray.o.set(origin);
        this._ray.d.set(direction);

        // 计算node的高
        const collider = this.node.getComponent(Collider);
        const halfHeight = collider ? collider.worldBounds.halfExtents.y : 0;

        const hit = PhysicsSystem.instance.raycastClosest(this._ray, 0xffffffff,  halfHeight);
        console.log('Raycast hit:', hit);
        this._isGrounded = !!hit;
    }
}
