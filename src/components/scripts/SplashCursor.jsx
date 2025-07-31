'use client';
import { useEffect, useRef } from 'react';

function SplashCursor({
  // You can customize these props if you want
  SIM_RESOLUTION = 84,
  DYE_RESOLUTION = 1440,
  CAPTURE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 2,
  VELOCITY_DISSIPATION = 3,
  PRESSURE = 0.2,
  PRESSURE_ITERATIONS = 20,
  CURL = 15,
  SPLAT_RADIUS = 0.3,
  SPLAT_FORCE = 9000,
  SHADING = true,
  COLOR_UPDATE_SPEED = 10,
  BACK_COLOR = { r: 1, g: 0.5, b: 0.5 },
  TRANSPARENT = true
}) {
  const canvasRef = useRef(null);
  let animationFrameId = null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = {
      SIM_RESOLUTION,
      DYE_RESOLUTION,
      CAPTURE_RESOLUTION,
      DENSITY_DISSIPATION,
      VELOCITY_DISSIPATION,
      PRESSURE,
      PRESSURE_ITERATIONS,
      CURL,
      SPLAT_RADIUS,
      SPLAT_FORCE,
      SHADING,
      COLOR_UPDATE_SPEED,
      BACK_COLOR,
      TRANSPARENT,
      PAUSED: false,
      TRANSPARENT_BACK: false,
    };

    let gl = getWebGLContext(canvas);
    let GL_EXTENSIONS = getExtensions(gl);
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);
    let captureRes = getResolution(config.CAPTURE_RESOLUTION);
    let textureRes = getResolution(config.DYE_RESOLUTION);

    const pointers = [];
    const defaultPointer = new Pointer();
    defaultPointer.id = 0;
    defaultPointer.down = true;
    pointers.push(defaultPointer);

    // Global GLSL shader sources (explicitly concatenated strings)
    const baseVertexShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'attribute vec2 aPosition;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'void main () {\n' +
      '    vUv = aPosition * 0.5 + 0.5;\n' +
      '    vL = vUv - vec2(1.0, 0.0) / RESOLUTION;\n' +
      '    vR = vUv + vec2(1.0, 0.0) / RESOLUTION;\n' +
      '    vT = vUv + vec2(0.0, 1.0) / RESOLUTION;\n' +
      '    vB = vUv - vec2(0.0, 1.0) / RESOLUTION;\n' +
      '    gl_Position = vec4(aPosition, 0.0, 1.0);\n' +
      '}\n';

    const copyShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'uniform sampler2D uTexture;\n' +
      'void main () {\n' +
      '    gl_FragColor = texture2D(uTexture, vUv);\n' +
      '}\n';

    const clearShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'uniform sampler2D uTexture;\n' +
      'uniform float value;\n' +
      'void main () {\n' +
      '    gl_FragColor = vec4(texture2D(uTexture, vUv).rgb * value, 1.0);\n' +
      '}\n';

    const colorShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'uniform vec4 color;\n' +
      'void main () {\n' +
      '    gl_FragColor = color;\n' +
      '}\n';

    const displayShaderSource =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uTexture;\n' +
      'uniform sampler2D uDithering;\n' +
      'uniform vec2 ditherScale;\n' +
      'uniform vec2 texelSize;\n' +
      'vec3 linearToGamma (vec3 color) {\n' +
      '    color = max(color, vec3(0));\n' +
      '    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));\n' +
      '}\n' +
      'void main () {\n' +
      '    vec3 c = texture2D(uTexture, vUv).rgb;\n' +
      '    #ifdef SHADING\n' +
      '        vec3 lc = texture2D(uTexture, vL).rgb;\n' +
      '        vec3 rc = texture2D(uTexture, vR).rgb;\n' +
      '        vec3 tc = texture2D(uTexture, vT).rgb;\n' +
      '        vec3 bc = texture2D(uTexture, vB).rgb;\n' +
      '        float dx = length(rc) - length(lc);\n' +
      '        float dy = length(tc) - length(bc);\n' +
      '        vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n' +
      '        vec3 l = vec3(0.0, 0.0, 1.0);\n' +
      '        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);\n' +
      '        c *= diffuse;\n' +
      '    #endif\n' +
      '    float a = max(c.r, max(c.g, c.b));\n' +
      '    gl_FragColor = vec4(c, a);\n' +
      '}\n';

    const splatShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'uniform sampler2D uTarget;\n' +
      'uniform float aspectRatio;\n' +
      'uniform vec3 color;\n' +
      'uniform vec2 point;\n' +
      'uniform float radius;\n' +
      'void main () {\n' +
      '    vec2 p = vUv - point;\n' +
      '    p.x *= aspectRatio;\n' +
      '    vec3 splat = exp(-dot(p, p) / radius) * color;\n' +
      '    gl_FragColor = texture2D(uTarget, vUv) + vec4(splat, 1.0);\n' +
      '}\n';

    const advectionShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'uniform sampler2D uVelocity;\n' +
      'uniform sampler2D uSource;\n' +
      'uniform vec2 texelSize;\n' +
      'uniform float dt;\n' +
      'uniform float dyeDissipation;\n' +
      'void main () {\n' +
      '    vec2 v = texture2D(uVelocity, vUv).xy;\n' +
      '    vec2 coord = vUv - dt * v * texelSize;\n' +
      '    gl_FragColor = dyeDissipation * texture2D(uSource, coord);\n' +
      '}\n';

    const divergenceShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '    float L = texture2D(uVelocity, vL).x;\n' +
      '    float R = texture2D(uVelocity, vR).x;\n' +
      '    float T = texture2D(uVelocity, vT).y;\n' +
      '    float B = texture2D(uVelocity, vB).y;\n' +
      '    float div = 0.5 * (R - L + T - B);\n' +
      '    gl_FragColor = vec4(div, div, div, 1.0);\n' +
      '}\n';

    const curlShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '    float L = texture2D(uVelocity, vL).y;\n' +
      '    float R = texture2D(uVelocity, vR).y;\n' +
      '    float T = texture2D(uVelocity, vT).x;\n' +
      '    float B = texture2D(uVelocity, vB).x;\n' +
      '    float curl = 0.5 * (R - L - T + B);\n' +
      '    gl_FragColor = vec4(curl, curl, curl, 1.0);\n' +
      '}\n';

    const vorticityShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uVelocity;\n' +
      'uniform sampler2D uCurl;\n' +
      'uniform float curl;\n' +
      'uniform float dt;\n' +
      'void main () {\n' +
      '    float c = texture2D(uCurl, vUv).x;\n' +
      '    vec2 force = vec2(abs(c) * curl, 0.0);\n' +
      '    force.x *= sign(c);\n' +
      '    vec2 vel = texture2D(uVelocity, vUv).xy;\n' +
      '    vec2 vc = normalize(vec2(abs(vel.y), abs(vel.x)));\n' +
      '    vec2 n = vc * force;\n' +
      '    gl_FragColor = vec4(texture2D(uVelocity, vUv).xy + n * dt, 0.0, 1.0);\n' +
      '}\n';

    const pressureShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uPressure;\n' +
      'uniform sampler2D uDivergence;\n' +
      'void main () {\n' +
      '    float L = texture2D(uPressure, vL).x;\n' +
      '    float R = texture2D(uPressure, vR).x;\n' +
      '    float T = texture2D(uPressure, vT).x;\n' +
      '    float B = texture2D(uPressure, vB).x;\n' +
      '    float C = texture2D(uPressure, vUv).x;\n' +
      '    float div = texture2D(uDivergence, vUv).x;\n' +
      '    float p = (L + R + B + T - div) * 0.25;\n' +
      '    gl_FragColor = vec4(p, p, p, 1.0);\n' +
      '}\n';

    const gradientSubtractShader =
      'precision highp float;\n' +
      'precision highp sampler2D;\n' +
      'varying vec2 vUv;\n' +
      'varying vec2 vL;\n' +
      'varying vec2 vR;\n' +
      'varying vec2 vT;\n' +
      'varying vec2 vB;\n' +
      'uniform sampler2D uPressure;\n' +
      'uniform sampler2D uVelocity;\n' +
      'void main () {\n' +
      '    float L = texture2D(uPressure, vL).x;\n' +
      '    float R = texture2D(uPressure, vR).x;\n' +
      '    float T = texture2D(uPressure, vT).x;\n' +
      '    float B = texture2D(uPressure, vB).x;\n' +
      '    vec2 vo = texture2D(uVelocity, vUv).xy;\n' +
      '    vec2 v = vo - 0.5 * vec2(R - L, T - B);\n' +
      '    gl_FragColor = vec4(v, 0.0, 1.0);\n' +
      '}\n';

    // Helper functions within useEffect scope
    function getWebGLContext(canvas) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let glContext = canvas.getContext('webgl2', params);
      if (glContext) {
        return glContext;
      }
      glContext = canvas.getContext('webgl', params);
      return glContext;
    }

    function getExtensions(glContext) {
      const extensions = {
        webgl2: glContext instanceof WebGL2RenderingContext,
        formatRGBA: {},
        halfFloatTexType: glContext.HALF_FLOAT,
        linear: glContext.LINEAR,
        nearest: glContext.NEAREST
      };

      if (extensions.webgl2) {
        extensions.formatRGBA = { internalFormat: glContext.RGBA16F, format: glContext.RGBA };
        extensions.halfFloatTexType = glContext.HALF_FLOAT;
        extensions.linear = glContext.LINEAR;
        extensions.nearest = glContext.NEAREST;
      } else {
        extensions.textureFloat = glContext.getExtension('OES_texture_float');
        if (extensions.textureFloat) {
          extensions.halfFloatTexType = extensions.textureFloat.HALF_FLOAT_OES;
          extensions.formatRGBA = { internalFormat: glContext.RGBA, format: glContext.RGBA };
        } else {
          throw new Error('No float textures supported');
        }
        extensions.linearFloat = glContext.getExtension('OES_texture_float_linear');
        extensions.linear = extensions.linearFloat ? glContext.LINEAR : glContext.NEAREST;
        extensions.nearest = glContext.NEAREST;
      }
      return extensions;
    }

    function getResolution(resolution) {
      let scale = gl.drawingBufferWidth / gl.drawingBufferHeight;
      let resX;
      let resY;
      if (scale < 1) {
        resX = resolution;
        resY = Math.floor(resolution * scale);
      } else {
        resX = Math.floor(resolution / scale);
        resY = resolution;
      }
      return { width: resX, height: resY };
    }

    class Pointer {
      constructor() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = [0, 0, 0];
      }
    }

    class Program {
      constructor(vertexShader, fragmentShader) {
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
          throw gl.getProgramInfoLog(this.program);

        this.uniforms = {};
        for (let i = 0; i < gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS); i++) {
          const uniform = gl.getActiveUniform(this.program, i);
          this.uniforms[uniform.name] = gl.getUniformLocation(this.program, uniform.name);
        }
      }

      bind() {
        gl.useProgram(this.program);
      }
    }

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(shader);
      return shader;
    }

    const clearProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, clearShader));
    const colorProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, colorShader));
    const displayProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, displayShaderSource));
    const splatProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, splatShader));
    const advectionProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, advectionShader));
    const divergenceProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, divergenceShader));
    const curlProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, curlShader));
    const vorticityProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, vorticityShader));
    const pressureProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, pressureShader));
    const gradientSubtractProgram = new Program(compileShader(gl.VERTEX_SHADER, baseVertexShader), compileShader(gl.FRAGMENT_SHADER, gradientSubtractShader));

    class Framebuffer {
      constructor(width, height, internalFormat, format, type, param) {
        this.width = width;
        this.height = height;
        this.internalFormat = internalFormat;
        this.format = format;
        this.type = type;
        this.param = param;
        this.fbo = gl.createFramebuffer();
        this.texture = gl.createTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.viewport(0, 0, width, height);
      }

      attach(id) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        return id;
      }
    }

    class DoubleFramebuffer {
      constructor(width, height, internalFormat, format, type, param) {
        this.width = width;
        this.height = height;
        this.internalFormat = internalFormat;
        this.format = format;
        this.type = type;
        this.param = param;
        this.fbo1 = new Framebuffer(width, height, internalFormat, format, type, param);
        this.fbo2 = new Framebuffer(width, height, internalFormat, format, type, param);
      }

      get read() {
        return this.fbo1;
      }

      get write() {
        return this.fbo2;
      }

      swap() {
        let temp = this.fbo1;
        this.fbo1 = this.fbo2;
        this.fbo2 = temp;
      }
    }

    let density = new DoubleFramebuffer(dyeRes.width, dyeRes.height, GL_EXTENSIONS.formatRGBA.internalFormat, GL_EXTENSIONS.formatRGBA.format, GL_EXTENSIONS.halfFloatTexType, GL_EXTENSIONS.linear);
    let velocity = new DoubleFramebuffer(simRes.width, simRes.height, GL_EXTENSIONS.formatRGBA.internalFormat, GL_EXTENSIONS.formatRGBA.format, GL_EXTENSIONS.halfFloatTexType, GL_EXTENSIONS.linear);
    let pressure = new DoubleFramebuffer(simRes.width, simRes.height, GL_EXTENSIONS.formatRGBA.internalFormat, GL_EXTENSIONS.formatRGBA.format, GL_EXTENSIONS.halfFloatTexType, GL_EXTENSIONS.linear);
    let divergence = new Framebuffer(simRes.width, simRes.height, GL_EXTENSIONS.formatRGBA.internalFormat, GL_EXTENSIONS.formatRGBA.format, GL_EXTENSIONS.halfFloatTexType, GL_EXTENSIONS.nearest);
    let curl = new Framebuffer(simRes.width, simRes.height, GL_EXTENSIONS.formatRGBA.internalFormat, GL_EXTENSIONS.formatRGBA.format, GL_EXTENSIONS.halfFloatTexType, GL_EXTENSIONS.nearest);

    let ditheringTexture = createDitheringTexture();
    let currentColor = { r: Math.random(), g: Math.random(), b: Math.random() };

    function createDitheringTexture() {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      const size = 256;
      const data = new Uint8Array(size * size * 4);
      for (let i = 0; i < size * size; i++) {
        data[i * 4] = Math.floor(Math.random() * 255);
        data[i * 4 + 1] = Math.floor(Math.random() * 255);
        data[i * 4 + 2] = Math.floor(Math.random() * 255);
        data[i * 4 + 3] = Math.floor(Math.random() * 255);
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return texture;
    }

    function splat(pointer) {
      const dx = pointer.deltaX * config.SPLAT_FORCE;
      const dy = pointer.deltaY * config.SPLAT_FORCE;
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, pointer.texcoordX, pointer.texcoordY);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
      blit(velocity.write.fbo);
      velocity.swap();

      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, pointer.texcoordX, pointer.texcoordY);
      gl.uniform3f(splatProgram.uniforms.color, pointer.color.r, pointer.color.g, pointer.color.b);
      gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
      blit(density.write.fbo);
      density.swap();
    }

    function multipleSplats(amount) {
      for (let i = 0; i < amount; i++) {
        const color = generateColor();
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat({
          texcoordX: x / canvas.width,
          texcoordY: y / canvas.height,
          deltaX: dx / canvas.width,
          deltaY: dy / canvas.height,
          color: color,
        });
      }
    }

    function generateColor() {
      const c = HSVtoRGB(Math.random(), 1.0, 1.0);
      return { r: c.r * 0.15, g: c.g * 0.15, b: c.b * 0.15 };
    }

    function HSVtoRGB(h, s, v) {
      let r, g, b;
      let i = Math.floor(h * 6);
      let f = h * 6 - i;
      let p = v * (1 - s);
      let q = v * (1 - f * s);
      let t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
      }
      return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
      };
    }

    function blit(destination) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0;

    function updateFrame() {
      if (config.PAUSED) {
        animationFrameId = null; // Ensure ID is cleared if paused
        return;
      }

      const dt = (Date.now() - lastUpdateTime) / 1000;
      lastUpdateTime = Date.now();

      updateColors(dt);
      applyInput();
      advect(dt);
      project(dt);
      render(gl.drawingBufferWidth, gl.drawingBufferHeight);

      animationFrameId = requestAnimationFrame(updateFrame);
    }

    function advect(dt) {
      gl.viewport(0, 0, simRes.width, simRes.height);
      advectionProgram.bind();
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.attach(1));
      gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dyeDissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write.fbo);
      velocity.swap();

      gl.viewport(0, 0, dyeRes.width, dyeRes.height);
      advectionProgram.bind();
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
      gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / dyeRes.width, 1.0 / dyeRes.height);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dyeDissipation, config.DENSITY_DISSIPATION);
      blit(density.write.fbo);
      density.swap();
    }

    function project(dt) {
      gl.viewport(0, 0, simRes.width, simRes.height);
      divergenceProgram.bind();
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence.fbo);

      pressureProgram.bind();
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write.fbo);
        pressure.swap();
      }

      gradientSubtractProgram.bind();
      gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, 1.0 / simRes.width, 1.0 / simRes.height);
      blit(velocity.write.fbo);
      velocity.swap();
    }

    function applyInput() {
      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i];
        if (p.moved) {
          p.moved = false;
          splat(p);
        }
      }
    }

    function render(width, height) {
      gl.viewport(0, 0, width, height);
      displayProgram.bind();
      gl.uniform1i(displayProgram.uniforms.uTexture, density.read.attach(0));
      gl.uniform2f(displayProgram.uniforms.texelSize, 1.0 / width, 1.0 / height);
      gl.bindTexture(gl.TEXTURE_2D, ditheringTexture);
      gl.uniform1i(displayProgram.uniforms.uDithering, 1);
      gl.uniform2f(displayProgram.uniforms.ditherScale, width / 256, height / 256);
      blit(null);
    }

    function updateColors(dt) {
      if (!config.COLORFUL) return; // ensure COLORFUL is enabled in config if needed
      currentColor.r += dt * config.COLOR_UPDATE_SPEED;
      currentColor.g += dt * config.COLOR_UPDATE_SPEED;
      currentColor.b += dt * config.COLOR_UPDATE_SPEED;
      currentColor.r = currentColor.r % 1;
      currentColor.g = currentColor.g % 1;
      currentColor.b = currentColor.b % 1;
    }

    function updatePointerMoveData(pointer, clientX, clientY) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = clientX / canvas.width;
      pointer.texcoordY = 1.0 - clientY / canvas.height; // Invert Y for WebGL
      pointer.deltaX = pointer.texcoordX - pointer.prevTexcoordX;
      pointer.deltaY = pointer.texcoordY - pointer.prevTexcoordY;
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    function updatePointerDownData(pointer, clientX, clientY) {
      pointer.color = generateColor();
      pointer.down = true;
      pointer.texcoordX = clientX / canvas.width;
      pointer.texcoordY = 1.0 - clientY / canvas.height; // Invert Y for WebGL
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.moved = false;
    }

    function updatePointerUpData(pointer) {
      pointer.down = false;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.moved = false;
    }

    // Event Listeners
    canvas.addEventListener('mousemove', e => {
      updatePointerMoveData(pointers[0], e.clientX, e.clientY);
    });

    canvas.addEventListener('mousedown', e => {
      updatePointerDownData(pointers[0], e.clientX, e.clientY);
      multipleSplats(1); // Add a splat on click
    });

    window.addEventListener('mouseup', () => {
      updatePointerUpData(pointers[0]);
    });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touches = e.changedTouches;
      let pointer = pointers[0]; // Assuming single touch for simplicity, adapt if multi-touch needed
      if (touches.length > 0) {
        updatePointerMoveData(pointer, touches[0].clientX, touches[0].clientY);
      }
    }, { passive: false });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const touches = e.changedTouches;
      let pointer = pointers[0]; // Assuming single touch
      if (touches.length > 0) {
        updatePointerDownData(pointer, touches[0].clientX, touches[0].clientY);
        multipleSplats(1); // Add a splat on touch
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      updatePointerUpData(pointers[0]);
    });

    // Event listener for toggling splash effect from SplashToggleButton
    const handleToggleSplash = (event) => {
      config.PAUSED = !event.detail;
      if (!config.PAUSED) {
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(updateFrame);
        }
      } else {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    };

    window.addEventListener('cursorSplashToggle', handleToggleSplash);

    // Initial start of the animation loop based on initial config.PAUSED state
    if (!config.PAUSED) {
      animationFrameId = requestAnimationFrame(updateFrame);
    }

    // Cleanup function: remove event listener and cancel animation frame
    return () => {
      window.removeEventListener('cursorSplashToggle', handleToggleSplash);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // No need for explicit dependencies here, React handles it
  }, [
    SIM_RESOLUTION,
    DYE_RESOLUTION,
    CAPTURE_RESOLUTION,
    DENSITY_DISSIPATION,
    VELOCITY_DISSIPATION,
    PRESSURE,
    PRESSURE_ITERATIONS,
    CURL,
    SPLAT_RADIUS,
    SPLAT_FORCE,
    SHADING,
    COLOR_UPDATE_SPEED,
    BACK_COLOR,
    TRANSPARENT,
  ]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

export default SplashCursor;