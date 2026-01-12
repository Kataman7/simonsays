import { ShaderManager } from './shader.js';
import { Camera } from './camera.js';
import { Mat4 } from '../utils/math.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.shaderManager = null;
        this.camera = null;
        
        this.buffers = {
            position: null,
            color: null,
            indices: null
        };

        this.modelMatrix = new Mat4();
        this.rotationAngle = { x: 0, y: 0, z: 0 };
        this.targetRotation = { x: 0, y: 0, z: 0 };
        this.isRotating = false;

        this.initialize();
    }

    initialize() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL n\'est pas supporté par ce navigateur');
        }

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);

        this.shaderManager = new ShaderManager(this.gl);
        this.shaderManager.initialize();

        this.camera = new Camera();
        this.camera.setAspect(this.canvas.width, this.canvas.height);

        this.buffers.position = this.gl.createBuffer();
        this.buffers.color = this.gl.createBuffer();
        this.buffers.indices = this.gl.createBuffer();
    }

    updateGeometry(geometry) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.vertices, this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.colors, this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indices, this.gl.STATIC_DRAW);

        this.indexCount = geometry.indices.length;
    }

    rotateTo(x, y, z, onComplete = null) {
        this.targetRotation = { x, y, z };
        this.isRotating = true;
        this.onRotationComplete = onComplete;
    }

    updateRotation(deltaTime) {
        if (!this.isRotating) return;

        const speed = 4.0;
        let completed = true;

        ['x', 'y', 'z'].forEach(axis => {
            const diff = this.targetRotation[axis] - this.rotationAngle[axis];
            if (Math.abs(diff) > 0.01) {
                this.rotationAngle[axis] += diff * speed * deltaTime;
                completed = false;
            } else {
                this.rotationAngle[axis] = this.targetRotation[axis];
            }
        });

        if (completed) {
            this.isRotating = false;
            if (this.onRotationComplete) {
                this.onRotationComplete();
                this.onRotationComplete = null;
            }
        }
    }

    render(deltaTime = 0.016) {
        this.updateRotation(deltaTime);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.shaderManager.use();
        const locations = this.shaderManager.getLocations();

        this.modelMatrix.identity();
        this.modelMatrix.rotateY(this.rotationAngle.y);
        this.modelMatrix.rotateX(this.rotationAngle.x);
        this.modelMatrix.rotateZ(this.rotationAngle.z);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.enableVertexAttribArray(locations.attributes.position);
        this.gl.vertexAttribPointer(locations.attributes.position, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
        this.gl.enableVertexAttribArray(locations.attributes.color);
        this.gl.vertexAttribPointer(locations.attributes.color, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(locations.uniforms.modelMatrix, false, this.modelMatrix.elements);
        this.gl.uniformMatrix4fv(locations.uniforms.viewMatrix, false, this.camera.getViewMatrix().elements);
        this.gl.uniformMatrix4fv(locations.uniforms.projectionMatrix, false, this.camera.getProjectionMatrix().elements);
        this.gl.uniform3f(locations.uniforms.lightPosition, 3.0, 3.0, 5.0);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }

    getCamera() {
        return this.camera;
    }

    getModelMatrix() {
        return this.modelMatrix;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        this.camera.setAspect(width, height);
    }
}
