import * as THREE from "three"
import * as POSTPROCESSING from "postprocessing"
import { BlendFunction } from 'postprocessing'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SSGIEffect, TRAAEffect, VelocityDepthNormalPass } from "./src/lib/realism-effects"
import { options } from "./src/options"
import { debug } from "./src/debug"


let scene, camera, renderer, environment, controls, composer, gltflLoader
let currentModel = null;


const init = () => {

    debug();

    scene = new THREE.Scene();
    scene.background = options.backgroundColor;

    camera = new THREE.PerspectiveCamera(...options.camera);
    camera.position.set(0, 0, 2);

    renderer = new THREE.WebGLRenderer(options.renderer);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, document.querySelector("#orbitControlsDomElem"))
    controls.enableDamping = true;
    camera.position.fromArray([0, 0, 3]);
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 0.5;

    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(options.envMap.url, (envMap) => {
        environment = envMap;
        environment.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = environment;
    });

    const draco = new DRACOLoader();
    draco.setDecoderConfig({ type: "js" });
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    gltflLoader = new GLTFLoader();
    gltflLoader.setDRACOLoader(draco);

    // Initialize composer
    composer = new POSTPROCESSING.EffectComposer(renderer)

    // RENDER pass
    composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));

    // SSAO pass
    const ssao = new POSTPROCESSING.SSAOEffect(camera, {
        blendFunction: BlendFunction.MULTIPLY,
        distanceScaling: false,
        radius: 2,
        intensity: 1,
    })
    console.log(ssao)
    ssao.radius = 0.5
    ssao.samples = 30
    ssao.rings = 24
    composer.addPass(new POSTPROCESSING.EffectPass(camera, ssao))
    
    
    // // BLOOM pass
    // composer.addPass(new POSTPROCESSING.EffectPass(camera, new POSTPROCESSING.BloomEffect()));
    

    // // VELOCITY pass
    // const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera);
    // composer.addPass(velocityDepthNormalPass);

    // // SSGI pass
    // const ssgiEffect = new SSGIEffect(composer, scene, camera, { ...options.ssgi, velocityDepthNormalPass });
    // composer.addPass(new POSTPROCESSING.EffectPass(scene, ssgiEffect));


    // // TRAA pass
    // const traaEffect = new TRAAEffect(scene, camera, velocityDepthNormalPass, options.traa)
    // const traaPass = new POSTPROCESSING.EffectPass(camera, traaEffect)
    // composer.addPass(traaPass)

    // // VIGNETTE pass
    // const vignetteEffect = new POSTPROCESSING.VignetteEffect(options.vignette)
    // composer.addPass(new POSTPROCESSING.EffectPass(camera, vignetteEffect))

    renderer.setAnimationLoop(loop);
};


const loadTestGLTF = () => {
    // const gltflLoader = new GLTFLoader()
    let url = options.testModel.url;
    gltflLoader.load(url, asset => {
        currentModel = asset.scene;
        scene.add(currentModel)
    })
}


const loadGLTF = (file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
        // const loader = new GLTFLoader();
        const url = URL.createObjectURL(file);

        gltflLoader.load(url, function (gltf) {

            if (currentModel) {
                scene.remove(currentModel);
            }

            currentModel = gltf.scene;
            scene.add(currentModel);

            // center and scale model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            currentModel.scale.setScalar(scale);

            URL.revokeObjectURL(url);
        }, undefined, function (error) {
            console.error('Error loading GLTF:', error);
            alert('Error loading GLTF - ' + error);
            URL.revokeObjectURL(url);
        });
    };

    reader.readAsDataURL(file);
}

document.getElementById('gltfFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        loadGLTF(file);
    }
});

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// render loop
const loop = () => {
    controls.update();
    camera.updateMatrixWorld();

    // render
    options.useComposer ? composer.render() : renderer.render(scene, camera);
}

init();

// load test model
if (options.testModel.load) loadTestGLTF();


function changeModelColor(color) {
    if (!currentModel) return;
    currentModel.traverse(function (child) {
        if (child.isMesh && child.material) {
            child.material.color.setHex(color);
        }
    });
}




















