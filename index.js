import * as THREE from "three"
import * as POSTPROCESSING from "postprocessing"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SSGIEffect, TRAAEffect, VelocityDepthNormalPass } from "./src/lib/realism-effects"
import { N8AOPostPass } from "n8ao";
import { ProgressiveShadows } from "./src/lib/progressive-shadows"
import { options } from "./src/options"
import { debug } from "./src/debug"


let scene, camera, renderer, environment, controls, composer, loader
let currentModel = null;
let /**
   * @type {ProgressiveShadows}
   */
    progressiveShadows;


const init = async () => {

    debug();

    scene = new THREE.Scene();
    scene.background = options.backgroundColor;

    camera = new THREE.PerspectiveCamera(...options.camera);
    camera.position.set(0, 0, 2);

    // initialize renderer
    renderer = new THREE.WebGLRenderer(options.renderer);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // initialize controls
    controls = new OrbitControls(camera, document.querySelector("#orbitControlsDomElem"))
    controls.enableDamping = true;
    camera.position.fromArray([0, 0, 3]);
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 0.5;

    // initialize environment
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(options.envMap.url, (envMap) => {
        environment = envMap;
        environment.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = environment;
    });

    // initialize Draco
    const draco = new DRACOLoader();
    draco.setDecoderConfig({ type: "js" });
    draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader = new GLTFLoader();
    loader.setDRACOLoader(draco);


    if (options.progressiveShadows.use) {

        // initialize ProgressiveShadows
        const shadowCatcherSize = 8
        progressiveShadows = new ProgressiveShadows(renderer, scene, { size: shadowCatcherSize })
        progressiveShadows.lightOrigin.position.set(3, 3, 3);
        progressiveShadows.params.alphaTest = options.progressiveShadows.alphaTest;
        progressiveShadows.shadowCatcherMaterial.opacity = options.progressiveShadows.opacity;
        progressiveShadows.shadowCatcherMaterial.color = options.progressiveShadows.color;
    }

    if (options.useComposer) {

        // initialize composer
        composer = new POSTPROCESSING.EffectComposer(renderer);

        if (!options.ssgi.use) {

            // RENDER pass
            composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));

            // N8AO pass
            const n8aopass = new N8AOPostPass(scene, camera, window.innerWidth, window.innerHeight);
            n8aopass.configuration.aoRadius = options.N8AO.radius;
            n8aopass.configuration.distanceFalloff = options.N8AO.distanceFalloff;
            composer.addPass(n8aopass)
        }

        else {

            // VELOCITY pass
            const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera);
            composer.addPass(velocityDepthNormalPass);

            // SSGI pass
            const ssgiEffect = new SSGIEffect(composer, scene, camera, { ...options.ssgi, velocityDepthNormalPass });
            composer.addPass(new POSTPROCESSING.EffectPass(scene, ssgiEffect));
        }




    }



    // // BLOOM pass
    // composer.addPass(new POSTPROCESSING.EffectPass(camera, new POSTPROCESSING.BloomEffect()));

    // // TRAA pass
    // const traaEffect = new TRAAEffect(scene, camera, velocityDepthNormalPass, options.traa)
    // const traaPass = new POSTPROCESSING.EffectPass(camera, traaEffect)
    // composer.addPass(traaPass)

    // // VIGNETTE pass
    // const vignetteEffect = new POSTPROCESSING.VignetteEffect(options.vignette)
    // composer.addPass(new POSTPROCESSING.EffectPass(camera, vignetteEffect))

    if (options.testModel.load)
        await loadTestGLTF();

    renderer.setAnimationLoop(loop);
};




const loadTestGLTF = async () => {
    let url = options.testModel.url;
    const gltf = await loader.loadAsync(url)
    const matte = new THREE.ShadowMaterial();
    currentModel = gltf.scene;
    currentModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true

            // hide the plane
            // and use it only for AO
            if (child.name == "Plane") {
                child.material = matte;
            }
        }
    })
    scene.add(currentModel)

    // call this once all models are in scene
    if (options.progressiveShadows.use) {
        progressiveShadows.clear();
    }
}


const loadGLTF = (file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
        const url = URL.createObjectURL(file);

        loader.load(url, function (gltf) {

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

    if (options.progressiveShadows.use) {
        progressiveShadows.update(camera)
    }


    // render
    options.useComposer ? composer.render() : renderer.render(scene, camera);
    // renderer.render(scene, camera);
}

init();

// // load test model
// if (options.testModel.load) loadTestGLTF();


// function addShadowsToCurrentModel() {
//     if (!currentModel) return;
//     currentModel.traverse((child) => {
//         if (child.isMesh) {
//             child.castShadow = true
//             child.receiveShadow = true
//         }
//     })
// }


// function changeModelColor(color) {
//     if (!currentModel) return;
//     currentModel.traverse((child) => {
//         if (child.isMesh && child.material) {
//             child.material.color.setHex(color);
//         }
//     });
// }




















