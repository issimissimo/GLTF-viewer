import * as THREE from "three"
import * as POSTPROCESSING from "postprocessing"

import { SSGIEffect, TRAAEffect, VelocityDepthNormalPass } from "./src/lib/realism-effects"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader"

let scene, camera, renderer, composer;

const options = {
    renderer: {
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    },
    backgroundColor: new THREE.Color(0xdadada),
    envMap: "hdr/studio.hdr",
    ssgi: {
        distance: 5.98,
        thickness: 2.83,
        denoiseIterations: 1,
        denoiseKernel: 3,
        denoiseDiffuse: 25,
        denoiseSpecular: 25.54,
        radius: 11,
        phi: 0.875,
        lumaPhi: 20.652,
        depthPhi: 23.37,
        normalPhi: 26.087,
        roughnessPhi: 18.478,
        specularPhi: 7.1,
        envBlur: 0,
        importanceSampling: true,
        steps: 20,
        refineSteps: 4,
        resolutionScale: 1,
        missedRays: false
    },
    traa: {
        fullAccumulate: true
    },
    vignette: {
        darkness: 0.5,
        offset: 0.3
    },
}

const init = () => {

    // setup scene
    scene = new THREE.Scene();
    scene.background = options.backgroundColor;

    // setup camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 2);

    // setup renderer
    renderer = new THREE.WebGLRenderer(options.renderer);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // load hdr environment
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(options.envMap, (envMap) => {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = envMap;
    });

    // Initialize composer
    composer = new POSTPROCESSING.EffectComposer(renderer)

    // VELOCITY pass
    const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera);
    composer.addPass(velocityDepthNormalPass);

    // SSGI pass
    const ssgiEffect = new SSGIEffect(composer, scene, camera, { ...options.ssgi, velocityDepthNormalPass });
    composer.addPass(new POSTPROCESSING.EffectPass(scene, ssgiEffect));

    // TRAA pass
    const traaEffect = new TRAAEffect(scene, camera, velocityDepthNormalPass, options.traa)
    const traaPass = new POSTPROCESSING.EffectPass(camera, traaEffect)
    composer.addPass(traaPass)

    // VIGNETTE pass
    const vignetteEffect = new POSTPROCESSING.VignetteEffect(options.vignette)
    composer.addPass(new POSTPROCESSING.EffectPass(camera, vignetteEffect))

    // start render loop
    renderer.setAnimationLoop(loop);



    const gltflLoader = new GLTFLoader()
    let url = "gltf/monkey.glb"
    gltflLoader.load(url, asset => {
        console.log(asset)
        scene.add(asset.scene)











    })



}



window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



const loop = () => {

    composer.render();
}

init();

















