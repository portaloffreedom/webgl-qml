/* global WebGLDebugUtils */

(function() {
  "use strict";

  var mat4 = window.mat4;

  document.addEventListener('DOMContentLoaded', function() {
    webGLStart();
  }, false);

  var canvas;
  var gl;
  var mvMatrix = mat4.create();
  var pMatrix = mat4.create();
  var triangleVertexPositionBuffer;
  var triangleVertexColorBuffer;
  var squareVertexPositionBuffer;
  var squareVertexColorBuffer;
  var shaderProgram;
  var mvMatrixStack = [];

  function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length === 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
  }

  function degToRad(degrees) {
    return degrees * Math.PI / 180;
  }


  function initGL() {
    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      var canvasConf = {alpha: false};

      gl = canvas.getContext('webgl', canvasConf)
        || canvas.getContext('experimental-webgl', canvasConf);

      // debug
      // gl = WebGLDebugUtils.makeDebugContext(gl);
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    } catch(e) {
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-( ");
    }

    return gl;
  }

  function initShaders() {
    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader = getShader(gl, "shader-fs");

    var shaderProgram = {
      id: gl.createProgram(),
      vertexPositionAttribute: null,
      vertexColorAttribute: null,
      pMatrixUniform: null,
      mvMatrixUniform: null
    };

    gl.attachShader(shaderProgram.id, vertexShader);
    gl.attachShader(shaderProgram.id, fragmentShader);
    gl.linkProgram(shaderProgram.id);

    if (!gl.getProgramParameter(shaderProgram.id, gl.LINK_STATUS)) {
      console.error("Could not link shader program");
      return null;
    }

    gl.useProgram(shaderProgram.id);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram.id, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram.id, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram.id, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram.id, "uMVMatrix");

    return shaderProgram;
  }

  function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type === "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type === "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        console.error("unrecognised shader type: " + shaderScript.type)
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

  function initBuffers() {
    // TRIANGLE
    triangleVertexPositionBuffer = {
      id: gl.createBuffer(),
      itemSize: 3,
      numItems: 3
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer.id);
    var vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // COLOR BUFFERS - TRIANGLE
    triangleVertexColorBuffer = {
      id: gl.createBuffer(),
      itemSize: 4,
      numItems: 3
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer.id);

    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // SQUARE
    squareVertexPositionBuffer = {
      id: gl.createBuffer(),
      itemSize: 3,
      numItems: 4
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer.id);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // COLOR BUFFERS - SQUARE
    squareVertexColorBuffer = {
      id: gl.createBuffer(),
      itemSize: 4,
      numItems: 4
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer.id);
    colors = []
    for (var i=0; i < 4; i++) {
      colors = colors.concat([1.0, 0.5, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }

  function drawScene() {
    // console.log("drawScene");

    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(pMatrix, 45, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [-1.5, 0.0, -7.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer.id);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer.id);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms(shaderProgram);
    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

    mat4.translate(mvMatrix, mvMatrix, [3.0, 0.0, 0.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer.id);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer.id);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms(shaderProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
  }

  function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  }

  function resizeCanvas() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (canvas.width != width ||
        canvas.height != height) {
      // console.log("resize");
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      return true;
    }
    return false;
  }

  var needToRender = true;  // draw at least once
  function checkRender() {
     if (resizeCanvas() || needToRender) {
       needToRender = false;
       drawScene();
     }
     requestAnimationFrame(checkRender);
  }

  function webGLStart() {
    canvas = document.getElementById("qml-canvas");

    initGL(canvas);
    shaderProgram = initShaders();
    initBuffers();

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    // gl.enable(gl.DEPTH_TEST);

    // Near things obscure far things
    // gl.depthFunc(gl.LEQUAL);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    checkRender();
  }

  window.drawScene = drawScene;

})();
