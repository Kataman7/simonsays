import { Vec3 } from '../utils/math.js';

export class RayPicker {
    constructor(camera, cubeModel) {
        this.camera = camera;
        this.cubeModel = cubeModel;
    }

    pick(screenX, screenY, canvasWidth, canvasHeight, modelMatrix) {
        const ray = this.camera.screenToRay(screenX, screenY, canvasWidth, canvasHeight);

        let closestCube = null;
        let closestDistance = Infinity;

        for (const cube of this.cubeModel.cubes) {
            const worldPos = this.transformPosition(cube.position, modelMatrix);
            
            const cubeSize = 0.1 * cube.scale;

            const intersection = this.rayBoxIntersection(
                ray.origin,
                ray.direction,
                worldPos,
                cubeSize
            );

            if (intersection !== null && intersection < closestDistance) {
                closestDistance = intersection;
                closestCube = cube;
            }
        }

        return closestCube;
    }

    transformPosition(position, matrix) {
        const e = matrix.elements;
        const x = position.x * e[0] + position.y * e[4] + position.z * e[8] + e[12];
        const y = position.x * e[1] + position.y * e[5] + position.z * e[9] + e[13];
        const z = position.x * e[2] + position.y * e[6] + position.z * e[10] + e[14];
        return new Vec3(x, y, z);
    }

    rayBoxIntersection(rayOrigin, rayDir, boxCenter, boxSize) {
        const boxMin = new Vec3(
            boxCenter.x - boxSize,
            boxCenter.y - boxSize,
            boxCenter.z - boxSize
        );
        const boxMax = new Vec3(
            boxCenter.x + boxSize,
            boxCenter.y + boxSize,
            boxCenter.z + boxSize
        );

        let tMin = -Infinity;
        let tMax = Infinity;

        if (Math.abs(rayDir.x) > 0.0001) {
            const t1 = (boxMin.x - rayOrigin.x) / rayDir.x;
            const t2 = (boxMax.x - rayOrigin.x) / rayDir.x;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        } else if (rayOrigin.x < boxMin.x || rayOrigin.x > boxMax.x) {
            return null;
        }

        if (Math.abs(rayDir.y) > 0.0001) {
            const t1 = (boxMin.y - rayOrigin.y) / rayDir.y;
            const t2 = (boxMax.y - rayOrigin.y) / rayDir.y;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        } else if (rayOrigin.y < boxMin.y || rayOrigin.y > boxMax.y) {
            return null;
        }

        if (Math.abs(rayDir.z) > 0.0001) {
            const t1 = (boxMin.z - rayOrigin.z) / rayDir.z;
            const t2 = (boxMax.z - rayOrigin.z) / rayDir.z;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        } else if (rayOrigin.z < boxMin.z || rayOrigin.z > boxMax.z) {
            return null;
        }

        if (tMax < tMin || tMax < 0) {
            return null;
        }

        return tMin > 0 ? tMin : tMax;
    }
}
