import * as THREE from './js/src/Three.js';

const rgb = function(r, g, b) {
    return new THREE.Vector3(r, g, b);
}
const loader = function(path, texture) {
    return new Promise((resolve, reject) => {
        let loader = new THREE.FileLoader();
        if(typeof texture !== "undefined") {
            loader = new THREE.TextureLoader();
        }
        loader.load(path, (item) => resolve(item));
    })
}
const randomInteger = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const config = {
    colors: [
        { low: rgb(127,68,255), high: rgb(225,68,90) },
        { low: rgb(225, 109, 68), high: rgb(77, 115, 241) },
        { low: rgb(77, 115, 241), high: rgb(225, 109, 68) }
    ]
}

// Async function for generating webGL waves
const createArt = async function(colors) {    
    // For tracking status
    let reduceVector;
    let increasePressure;
    let reducePressure;
    let prevX = 0;
    let prevY = 0;
    let curValueX = 0;
    let curValueY = 0;
    let mouseEnterX = 0;
    let mouseEnterY = 0;

    // Import all the fragment and vertex shaders
    const noise = await loader('./shaders/noise.glsl');
    const fragment = await loader('./shaders/fragment.glsl');
    const vertex = await loader('./shaders/vertex.glsl');
    const lion = await loader('./images/lion.jpg', true);
    // For each of the selector elements
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({
        powerPreference: "high-performance",
        antialias: true, 
        alpha: true,
        canvas: canvas
    });
    
    // Get el width and height
    let elWidth = window.innerWidth;
    let elHeight = window.innerHeight
    
    // Set sizes and set scene/camera
    renderer.setSize( elWidth, elHeight );
    document.body.appendChild( renderer.domElement )
    renderer.setPixelRatio( elWidth/elHeight );
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, elWidth / elHeight, 0.1, 1000 );
    
    let i = 2;
    // Check on colors to use
    let high = config.colors[i].high; 
    let low = config.colors[i].low;

    // Create a plane, and pass that through to our shaders
    let geometry = new THREE.PlaneGeometry(600, 600, 100, 100);
    let material = new THREE.ShaderMaterial({
        uniforms: {
            u_lowColor: {type: 'v3', value: low },
            u_highColor: {type: 'v3', value: high },
            u_time: {type: 'f', value: 0},
            u_resolution: {type: 'v2', value: new THREE.Vector2(elWidth, elHeight) },
            u_mouse: {type: 'v2', value: new THREE.Vector2(0, 0) },
            u_height: {type: 'f', value: 1},
            u_manipulate: {type: 'f', value: 1 },
            u_veinDefinition: {type: 'f', value: 20 },
            u_goCrazy: { type: 't', value: 1 },
            u_inputTexture: {type: 't', value: lion},
            u_scale: {type: 'f', value: 0.85 },
            u_clickLength: { type: 'f', value: 1},
            u_rand: { type: 'f', value: randomInteger(0, 10) },
            u_rand: {type: 'f', value: new THREE.Vector2(randomInteger(6, 10), randomInteger(8, 10)) }
        },
        fragmentShader: noise + fragment,
        vertexShader: noise + vertex,
    });
    // Create the mesh and position appropriately
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, -300);
    scene.add(mesh);

    /* event listeners */
    document.getElementById('range').addEventListener('input', function(e) {
        mesh.material.uniforms.u_manipulate.value = this.value;
    })
    document.getElementById('veins').addEventListener('input', function(e) {
        mesh.material.uniforms.u_veinDefinition.value = this.value;
    })
    document.getElementById('crazy').addEventListener('input', function(e) {
        mesh.material.uniforms.u_goCrazy.value = this.value;
    })

    document.querySelectorAll('.color').forEach(function(item) {
        item.addEventListener('click', function(e) {
            let i = parseFloat(this.getAttribute('data-id'));
            mesh.material.uniforms.u_highColor.value = config.colors[i].high;
            mesh.material.uniforms.u_lowColor.value = config.colors[i].low;
        });
    });
    

    window.addEventListener('resize', function(e) {
        elWidth = window.innerWidth;
        elHeight = window.innerHeight;
        
        camera.aspect = elWidth / elHeight;
        camera.updateProjectionMatrix();

        mesh.material.uniforms.u_resolution.value = new THREE.Vector2(elWidth, elHeight);

        renderer.setSize( elWidth, elHeight );
    }, false);

    document.body.addEventListener('pointerenter', function(e) {
        prevX = curValueX;
        prevY = curValueY;
        mouseEnterX = e.pageX;
        mouseEnterY = e.pageY;
        clearInterval(reduceVector);
    });

    document.body.addEventListener('pointermove', function(e) {
        if(typeof reduceVector !== "undefined") {
            clearInterval(reduceVector);
            curValueX = 0;
            curValueY = 0;
        }
        let mouseMoveX = mouseEnterX - e.pageX;
        let mouseMoveY = mouseEnterY - e.pageY;
        mesh.material.uniforms.u_mouse.value = new THREE.Vector2(prevX + (mouseMoveX / elWidth), prevY + (mouseMoveY / elHeight));
    });
    
    document.getElementById('canvas').addEventListener('pointerdown', function(e) {
        if(typeof reducePressure !== "undefined") clearInterval(reducePressure);
        increasePressure = setInterval(function() {
            if(mesh.material.uniforms.u_clickLength.value < 3) {
                mesh.material.uniforms.u_clickLength.value += 0.03;
            }
        },1000/60);
    });

    document.getElementById('canvas').addEventListener('pointerup', function(e) {
        if(typeof increasePressure !== "undefined") clearInterval(increasePressure);
        reducePressure = setInterval(function() {
            if(mesh.material.uniforms.u_clickLength.value > 1) {
                mesh.material.uniforms.u_clickLength.value -= 0.03;
            }
        },1000/60);
    });
    
    // When the user leaves the canvas we will reset the position so we don't end up adding up
    // more and more movement until the effect stops working.
    document.body.addEventListener('pointerleave', function(e) {
        reduceVector = setInterval(function() {
            let startXNeg, startXPos, startYNeg, startYPos;
            let finishX, finishY;
            if(curValueX == 0 && curValueY == 0) {
                curValueX = mesh.material.uniforms.u_mouse.value.x;
                curValueY = mesh.material.uniforms.u_mouse.value.y;
            }
            if(typeof reduceVector == "function") {
                requestAnimationFrame(reduceVector);
            }
            if(curValueX > 0) {
                if(startXPos !== true) {
                    mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                } else { finishX = true; }
                curValueX -= 0.005;
                startXNeg = true;
            }
            else if(curValueX < 0) {
                if(startXNeg !== true) {
                    mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                } else { finishX = true; }
                curValueX += 0.005;
                startXPos = true;
            }
            if(curValueY > 0) {
                if(startYNeg !== true) {
                    mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                } else { finishY = true; }
                curValueY -= 0.005;
                startYPos = true;
            }
            else if(curValueY < 0) {
                if(startYNeg !== true) {
                    mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                } else { finishY = true; }
                curValueY += 0.005;
                startYNeg = true;
            }
            if(finishX == true && finishY == true) {
                clearInterval(reduceVector);
            }
        }, 1000/60);
    });

    // On hover effects for each item
    let enterTimer, exitTimer;
    document.getElementById('canvas').addEventListener('mouseenter', function(e) {
        if(typeof exitTimer !== "undefined") {
            clearTimeout(exitTimer);
        }
        enterTimer = setInterval(function() {
            if(mesh.material.uniforms.u_height.value >= 0.5) {
                mesh.material.uniforms.u_height.value -= 0.05;
            } else {
                clearTimeout(enterTimer);
            }
        }, 1000/60);
    });
    document.getElementById('canvas').addEventListener('mouseleave', function(e) {
        if(typeof enterTimer !== "undefined") {
            clearTimeout(enterTimer);
        }
        exitTimer = setInterval(function() {
            if(mesh.material.uniforms.u_height.value < 1) {
                mesh.material.uniforms.u_height.value += 0.05;
            } else {
                clearTimeout(exitTimer);
            }
        }, 1000/60);
    });
    // Render
    renderer.render( scene, camera );
    let t = 5;
    // Animate
    let backtrack = false;
    const animate = function () {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
        document.body.appendChild(renderer.domElement);
        mesh.material.uniforms.u_time.value = t;
        if(t < 10 && backtrack == false) {
            t = t + 0.005;
        } else {
            backtrack = true;
            t = t - 0.005;
            if(t < 0) {
                backtrack = false;
            }
        }
        
    };
    animate();
}

document.addEventListener("DOMContentLoaded", function(e) {
    createArt();
});