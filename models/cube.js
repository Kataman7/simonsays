import { Vec3 } from '../utils/math.js';

export class CubeModel {
    constructor(size = 4) {
        this.size = size;
        this.cubes = [];
        this.generateHollowCube();
    }

    generateRandomColor(index) {
        const hue = (index * 137.508) % 360;
        const saturation = 0.7 + (index % 3) * 0.1;
        const lightness = 0.5 + (index % 2) * 0.1;
        
        return this.hslToRgb(hue / 360, saturation, lightness);
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g, b];
    }

    generateHollowCube() {
        const offset = (this.size - 1) / 2;
        let cubeId = 0;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const isOnEdge = 
                        x === 0 || x === this.size - 1 ||
                        y === 0 || y === this.size - 1 ||
                        z === 0 || z === this.size - 1;

                    if (isOnEdge) {
                        const position = new Vec3(
                            (x - offset) * 0.45,
                            (y - offset) * 0.45,
                            (z - offset) * 0.45
                        );

                        const logicalIds = [];
                        const max = this.size - 1;

                        const faces = [];
                        if (z === max) faces.push(5);
                        if (z === 0) faces.push(4);
                        if (x === max) faces.push(1);
                        if (x === 0) faces.push(0);
                        if (y === max) faces.push(3);
                        if (y === 0) faces.push(2);

                        const faceIndex = this.determineFace(x, y, z);
                        const logicalId = this.calculateLogicalId(faceIndex, x, y, z);
                        const color = this.generateRandomColor(logicalId);

                        this.cubes.push({
                            id: cubeId++,
                            logicalId: logicalId,
                            faces: faces,
                            position,
                            color: [...color],
                            baseColor: [...color],
                            scale: 1.0,
                            face: faceIndex,
                            gridPos: { x, y, z }
                        });
                    }
                }
            }
        }
    }

    isOnFace(faceIndex, gridPos) {
        const { x, y, z } = gridPos;
        const max = this.size - 1;

        switch(faceIndex) {
            case 5: return z === max;
            case 4: return z === 0;
            case 1: return x === max;
            case 0: return x === 0;
            case 3: return y === max;
            case 2: return y === 0;
            default: return false;
        }
    }

    calculateLogicalId(face, x, y, z) {
        let u, v;
        const max = this.size - 1;

        switch(face) {
            case 5:
                u = x; v = y;
                break;
            case 4:
                u = max - x; v = y; 
                break;
            case 1:
                u = max - z; v = y;
                break;
            case 0:
                u = z; v = y;
                break;
            case 3:
                u = x; v = max - z;
                break;
            case 2:
                u = x; v = z;
                break;
            default:
                u = 0; v = 0;
        }

        return u + v * this.size;
    }

    determineFace(x, y, z) {
        const max = this.size - 1;
        
        if (z === max) return 5;
        if (z === 0) return 4;
        if (x === 0) return 0;
        if (x === max) return 1;
        if (y === 0) return 2;
        if (y === max) return 3;
        
        return 5;
    }

    getCubeById(id) {
        return this.cubes.find(cube => cube.id === id);
    }

    generateGeometry() {
        const vertices = [];
        const colors = [];
        const indices = [];
        
        const cubeSize = 0.14;
        
        const cubeVertices = [
            -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
            -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
            -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
            -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
             1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
            -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
        ];

        this.cubes.forEach((cube, cubeIndex) => {
            const baseIndex = cubeIndex * 24;

            for (let i = 0; i < cubeVertices.length; i += 3) {
                vertices.push(
                    cubeVertices[i] * cubeSize * cube.scale + cube.position.x,
                    cubeVertices[i + 1] * cubeSize * cube.scale + cube.position.y,
                    cubeVertices[i + 2] * cubeSize * cube.scale + cube.position.z
                );

                colors.push(cube.color[0], cube.color[1], cube.color[2]);
            }

            const faceIndices = [
                0, 1, 2, 0, 2, 3,
                4, 5, 6, 4, 6, 7,
                8, 9, 10, 8, 10, 11,
                12, 13, 14, 12, 14, 15,
                16, 17, 18, 16, 18, 19,
                20, 21, 22, 20, 22, 23
            ];

            faceIndices.forEach(index => {
                indices.push(baseIndex + index);
            });
        });

        return {
            vertices: new Float32Array(vertices),
            colors: new Float32Array(colors),
            indices: new Uint16Array(indices)
        };
    }

    resetVisuals() {
        this.cubes.forEach(cube => {
            cube.color = [...cube.baseColor];
            cube.scale = 1.0;
        });
    }
}
