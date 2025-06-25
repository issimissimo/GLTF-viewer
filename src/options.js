import * as THREE from "three"

export const options = {
    useComposer: true,
    renderer: {
        antialias: true,
        alpha: true,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
    },
    camera: [70, window.innerWidth / window.innerHeight, 0.1, 250],
    backgroundColor: new THREE.Color(0xffffff),
    envMap: {
        url: "hdr/studio.hdr",
    },
    N8AO: {
        radius: 0.5,
        distanceFalloff: 1,
    },
    progressiveShadows: {
        use: true,
        alphaTest: 0.3
    },
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
        darkness: 0.6,
        offset: 0.3
    },
    testModel: {
        load: true,
        url: "gltf/monkey.glb",
    }
}