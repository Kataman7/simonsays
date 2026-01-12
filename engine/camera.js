import { Vec3, Mat4 } from '../utils/math.js';

export class Camera {
    constructor() {
        this.position = new Vec3(0, 0, 3);
        this.target = new Vec3(0, 0, 0);
        this.up = new Vec3(0, 1, 0);
        
        this.fov = Math.PI / 4;
        this.aspect = 1.0;
        this.near = 0.1;
        this.far = 100.0;
        
        this.orthoSize = 1.5;
        this.useOrthographic = true;
        
        this.viewMatrix = new Mat4();
        this.projectionMatrix = new Mat4();
        
        this.updateMatrices();
    }

    setAspect(width, height) {
        this.aspect = width / height;
        this.updateMatrices();
    }

    lookAt(eye, target, up) {
        this.position = eye;
        this.target = target;
        this.up = up;
        this.updateMatrices();
    }

    updateMatrices() {
        this.viewMatrix = new Mat4().lookAt(this.position, this.target, this.up);
        
        if (this.useOrthographic) {
            const halfWidth = this.orthoSize * this.aspect;
            const halfHeight = this.orthoSize;
            this.projectionMatrix = new Mat4().orthographic(
                -halfWidth, halfWidth,
                -halfHeight, halfHeight,
                this.near,
                this.far
            );
        } else {
            this.projectionMatrix = new Mat4().perspective(
                this.fov,
                this.aspect,
                this.near,
                this.far
            );
        }
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    screenToRay(screenX, screenY, canvasWidth, canvasHeight) {
        const x = (2.0 * screenX) / canvasWidth - 1.0;
        const y = 1.0 - (2.0 * screenY) / canvasHeight;

        const invProjection = this.projectionMatrix.invert();
        const invView = this.viewMatrix.invert();

        const nearPoint = new Vec3(x, y, -1);
        const farPoint = new Vec3(x, y, 1);

        const rayOrigin = this.transformPoint(nearPoint, invProjection, invView);
        const rayEnd = this.transformPoint(farPoint, invProjection, invView);

        const rayDirection = rayEnd.subtract(rayOrigin).normalize();

        return {
            origin: rayOrigin,
            direction: rayDirection
        };
    }

    transformPoint(point, mat1, mat2) {
        const m = mat1.multiply(mat2);
        const e = m.elements;
        
        const x = point.x * e[0] + point.y * e[4] + point.z * e[8] + e[12];
        const y = point.x * e[1] + point.y * e[5] + point.z * e[9] + e[13];
        const z = point.x * e[2] + point.y * e[6] + point.z * e[10] + e[14];
        const w = point.x * e[3] + point.y * e[7] + point.z * e[11] + e[15];

        return new Vec3(x / w, y / w, z / w);
    }
}
