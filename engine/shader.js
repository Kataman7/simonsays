export class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.locations = {};
    }

    getVertexShaderSource() {
        return `
            attribute vec3 aPosition;
            attribute vec3 aColor;
            
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            varying vec3 vColor;
            varying vec3 vPosition;
            
            void main() {
                vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
                vPosition = worldPosition.xyz;
                gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
                vColor = aColor;
            }
        `;
    }

    getFragmentShaderSource() {
        return `
            precision mediump float;
            
            varying vec3 vColor;
            varying vec3 vPosition;
            
            uniform vec3 uLightPosition;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Erreur de compilation du shader: ${info}`);
        }

        return shader;
    }

    initialize() {
        const vertexShader = this.compileShader(
            this.getVertexShaderSource(),
            this.gl.VERTEX_SHADER
        );

        const fragmentShader = this.compileShader(
            this.getFragmentShaderSource(),
            this.gl.FRAGMENT_SHADER
        );

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(this.program);
            throw new Error(`Erreur de liaison du programme: ${info}`);
        }

        this.locations = {
            attributes: {
                position: this.gl.getAttribLocation(this.program, 'aPosition'),
                color: this.gl.getAttribLocation(this.program, 'aColor')
            },
            uniforms: {
                modelMatrix: this.gl.getUniformLocation(this.program, 'uModelMatrix'),
                viewMatrix: this.gl.getUniformLocation(this.program, 'uViewMatrix'),
                projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                lightPosition: this.gl.getUniformLocation(this.program, 'uLightPosition')
            }
        };

        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
    }

    use() {
        this.gl.useProgram(this.program);
    }

    getLocations() {
        return this.locations;
    }
}
