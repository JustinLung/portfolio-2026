import {
	CanvasTexture,
	LinearFilter,
	Vector2,
	type Camera,
	type Scene,
	type WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import asciiVertexShader from './heroAscii.vert?raw';
import asciiFragmentShader from './heroAscii.frag?raw';

// Ordered dark -> light; the shader picks a glyph by cell luminance.
const GLYPH_RAMP = ' .:-=+*#%@';
const GLYPH_TILE = 32;

const createGlyphAtlas = () => {
	const canvas = document.createElement('canvas');
	canvas.width = GLYPH_TILE * GLYPH_RAMP.length;
	canvas.height = GLYPH_TILE;

	const context = canvas.getContext('2d');
	if (context) {
		context.fillStyle = '#fff';
		context.font = `bold ${GLYPH_TILE * 0.9}px monospace`;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		[...GLYPH_RAMP].forEach((glyph, index) => {
			context.fillText(glyph, index * GLYPH_TILE + GLYPH_TILE / 2, GLYPH_TILE / 2);
		});
	}

	const texture = new CanvasTexture(canvas);
	texture.minFilter = LinearFilter;
	texture.generateMipmaps = false;
	return texture;
};

export const createAsciiComposer = (
	renderer: WebGLRenderer,
	scene: Scene,
	camera: Camera,
	cellSize = 9
) => {
	const glyphs = createGlyphAtlas();

	const asciiPass = new ShaderPass({
		uniforms: {
			tDiffuse: { value: null },
			tGlyphs: { value: glyphs },
			uResolution: { value: new Vector2(1, 1) },
			uCell: { value: cellSize },
			uGlyphCount: { value: GLYPH_RAMP.length }
		},
		vertexShader: asciiVertexShader,
		fragmentShader: asciiFragmentShader
	});

	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(asciiPass);
	composer.addPass(new OutputPass());

	const resize = (width: number, height: number, pixelRatio: number) => {
		composer.setPixelRatio(pixelRatio);
		composer.setSize(width, height);
		// ShaderPass clones its uniforms, so write through the pass rather than a local copy.
		asciiPass.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
		asciiPass.uniforms.uCell.value = cellSize * pixelRatio;
	};

	const dispose = () => {
		glyphs.dispose();
		composer.dispose();
	};

	const render = (delta: number) => composer.render(delta);

	return { render, resize, dispose };
};
