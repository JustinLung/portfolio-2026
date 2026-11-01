uniform sampler2D tDiffuse;
uniform sampler2D tGlyphs;
uniform vec2 uResolution;
uniform float uCell;
uniform float uGlyphCount;

varying vec2 vUv;

void main() {
	vec2 pixel = vUv * uResolution;
	vec2 grid = pixel / uCell;
	vec2 cell = floor(grid);
	vec2 local = fract(grid);

	// Sample the scene once per cell so every glyph takes a single flat colour.
	vec4 scene = texture2D(tDiffuse, (cell + 0.5) * uCell / uResolution);
	float luma = dot(scene.rgb, vec3(0.2126, 0.7152, 0.0722));
	// The scene is linear, so lift it before picking a glyph or most cells land on the faintest ones.
	float level = clamp(sqrt(luma) * 1.35, 0.0, 0.999);
	float glyph = floor(level * uGlyphCount);

	float mask = texture2D(tGlyphs, vec2((glyph + local.x) / uGlyphCount, local.y)).r;
	float cover = step(0.02, scene.a) * mask;

	vec3 tint = scene.rgb / max(max(scene.r, max(scene.g, scene.b)), 0.001);
	vec3 color = tint * (0.7 + 0.3 * level);

	gl_FragColor = vec4(color * cover, cover);
}
