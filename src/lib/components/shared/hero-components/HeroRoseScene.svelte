<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import {
		Color,
		MeshPhysicalMaterial,
		Plane,
		Raycaster,
		Sphere,
		SphereGeometry,
		Vector2,
		Vector3,
		type Group,
		type Mesh,
		type PerspectiveCamera
	} from 'three';
	import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
	import wobbleVertexShader from './heroWobble.vert?raw';
	import wobbleFragmentShader from './heroWobble.frag?raw';
	import { createAsciiComposer } from './heroAscii';

	type Props = {
		pointerX?: number;
		pointerY?: number;
		pointerActive?: boolean;
		pointerDown?: boolean;
		reducedMotion?: boolean;
		reveal?: { scale: number };
	};

	let {
		pointerX = 0,
		pointerY = 0,
		pointerActive = false,
		pointerDown = false,
		reducedMotion = false,
		reveal = { scale: 1 }
	}: Props = $props();

	const { size, renderer, scene, autoRender, renderStage } = useThrelte();
	const geometry = new SphereGeometry(1.82, 128, 96);
	const sphereRadius = 1.82;
	const raycaster = new Raycaster();
	const pointerNdc = new Vector2();
	const hitSphere = new Sphere();
	const worldCenter = new Vector3();
	const worldScale = new Vector3();
	const worldHit = new Vector3();
	const localHit = new Vector3();
	const dragPlane = new Plane();
	const dragPlaneNormal = new Vector3();
	const worldDragTarget = new Vector3();
	const localDragTarget = new Vector3();
	const dragAnchor = new Vector3(0, 0, sphereRadius);
	const dragOffsetTarget = new Vector3();
	const pointerTarget = new Vector2();
	const maxDragOffset = 0.82;

	const uniforms = {
		uTime: { value: 0 },
		uPositionFrequency: { value: 0.96 },
		uTimeFrequency: { value: 0.82 },
		uStrength: { value: 0.18 },
		uWarpPositionFrequency: { value: 0.38 },
		uWarpTimeFrequency: { value: 0.12 },
		uWarpStrength: { value: 1.37 },
		uPointer: { value: new Vector2() },
		uHoverPoint: { value: new Vector3(0, 0, sphereRadius) },
		uHoverStrength: { value: 0 },
		uDragOrigin: { value: new Vector3(0, 0, sphereRadius) },
		uDragOffset: { value: new Vector3() },
		uDragStrength: { value: 0 },
		uDragRadius: { value: 0.92 },
		uColorA: { value: new Color('#57001f') },
		uColorB: { value: new Color('#ff2c78') },
		uHoverColor: { value: new Color('#ffc1d8') }
	};

	const material = new CustomShaderMaterial({
		baseMaterial: MeshPhysicalMaterial,
		vertexShader: wobbleVertexShader,
		fragmentShader: wobbleFragmentShader,
		uniforms,
		roughness: 0.36,
		metalness: 0.04,
		clearcoat: 0.48,
		clearcoatRoughness: 0.28
	});

	let rotationX = $state(-0.12);
	let rotationY = $state(-0.3);
	let breath = $state(1);
	let sceneScale = $state(1.35);
	let sceneY = $state(-1.45);
	let camera = $state<PerspectiveCamera>();
	let revealGroup = $state<Group>();
	let mesh = $state<Mesh>();
	let elapsed = 0;
	let wasPointerDown = false;
	let dragEngaged = false;

	let ascii = $state.raw<ReturnType<typeof createAsciiComposer>>();

	// Replace Threlte's default render with the ASCII post-processing chain.
	$effect(() => {
		if (!camera) return;

		const composer = createAsciiComposer(renderer, scene, camera);
		ascii = composer;
		autoRender.set(false);

		return () => {
			autoRender.set(true);
			composer.dispose();
			ascii = undefined;
		};
	});

	$effect(() => {
		ascii?.resize(size.current.width, size.current.height, renderer.getPixelRatio());
	});

	useTask((delta) => ascii?.render(delta), {
		stage: renderStage,
		autoInvalidate: false
	});

	useTask((delta) => {
		const easing = 1 - Math.exp(-delta * 3);
		const targetX = -0.12 - pointerY * 0.16;
		const targetY = -0.3 + pointerX * 0.34;
		const pointerEnergy = Math.min(1, Math.hypot(pointerX, pointerY));
		const targetStrength = 0.18 + pointerEnergy * 0.08;
		const viewportAspect = size.current.width / Math.max(size.current.height, 1);
		const mobileScale = Math.min(1, Math.max(0.52, viewportAspect / 0.87));
		const targetSceneScale = 1.35 * mobileScale;
		const targetSceneY = viewportAspect < 0.8 ? -1.55 : -1.45;

		rotationX += (targetX - rotationX) * easing;
		rotationY += (targetY - rotationY) * easing;
		sceneScale += (targetSceneScale - sceneScale) * easing;
		sceneY += (targetSceneY - sceneY) * easing;
		revealGroup?.scale.setScalar(reveal.scale);
		pointerTarget.set(pointerX, -pointerY);
		uniforms.uPointer.value.lerp(pointerTarget, easing);
		uniforms.uStrength.value += (targetStrength - uniforms.uStrength.value) * easing;

		let hoverTarget = 0;
		if (pointerActive && camera && mesh) {
			pointerNdc.set(pointerX, -pointerY);
			raycaster.setFromCamera(pointerNdc, camera);
			mesh.getWorldPosition(worldCenter);
			mesh.getWorldScale(worldScale);
			hitSphere.set(
				worldCenter,
				sphereRadius * Math.max(worldScale.x, worldScale.y, worldScale.z) + 0.18
			);

			if (raycaster.ray.intersectSphere(hitSphere, worldHit)) {
				localHit.copy(worldHit);
				mesh.worldToLocal(localHit);
				localHit.normalize().multiplyScalar(sphereRadius);
				uniforms.uHoverPoint.value.lerp(localHit, 1 - Math.exp(-delta * 12));
				hoverTarget = 1;
			}
		}
		uniforms.uHoverStrength.value +=
			(hoverTarget - uniforms.uHoverStrength.value) * (1 - Math.exp(-delta * 8));

		if (reducedMotion) {
			dragEngaged = false;
			dragOffsetTarget.set(0, 0, 0);
			uniforms.uDragOffset.value.set(0, 0, 0);
			uniforms.uDragStrength.value = 0;
		} else {
			if (pointerDown && !wasPointerDown && camera && mesh) {
				pointerNdc.set(pointerX, -pointerY);
				raycaster.setFromCamera(pointerNdc, camera);
				mesh.updateWorldMatrix(true, false);
				mesh.getWorldPosition(worldCenter);
				mesh.getWorldScale(worldScale);
				hitSphere.set(
					worldCenter,
					sphereRadius * Math.max(worldScale.x, worldScale.y, worldScale.z) + 0.18
				);

				dragEngaged = Boolean(raycaster.ray.intersectSphere(hitSphere, worldHit));
				if (dragEngaged) {
					localHit.copy(worldHit);
					mesh.worldToLocal(localHit);
					dragAnchor.copy(localHit).normalize().multiplyScalar(sphereRadius);
					uniforms.uDragOrigin.value.copy(dragAnchor);
					worldHit.copy(dragAnchor);
					mesh.localToWorld(worldHit);
					camera.getWorldDirection(dragPlaneNormal);
					dragPlane.setFromNormalAndCoplanarPoint(dragPlaneNormal, worldHit);
					dragOffsetTarget.set(0, 0, 0);
				}
			} else if (!pointerDown) {
				dragEngaged = false;
			}

			if (dragEngaged && pointerDown && camera && mesh) {
				pointerNdc.set(pointerX, -pointerY);
				raycaster.setFromCamera(pointerNdc, camera);
				if (raycaster.ray.intersectPlane(dragPlane, worldDragTarget)) {
					localDragTarget.copy(worldDragTarget);
					mesh.worldToLocal(localDragTarget);
					dragOffsetTarget.copy(localDragTarget).sub(dragAnchor).clampLength(0, maxDragOffset);
				}
			} else {
				dragOffsetTarget.set(0, 0, 0);
			}

			const dragOffsetEasing = 1 - Math.exp(-delta * (dragEngaged ? 18 : 7));
			const dragStrengthEasing = 1 - Math.exp(-delta * (dragEngaged ? 14 : 8));
			uniforms.uDragOffset.value.lerp(dragOffsetTarget, dragOffsetEasing);
			uniforms.uDragStrength.value +=
				((dragEngaged ? 1 : 0) - uniforms.uDragStrength.value) * dragStrengthEasing;
		}
		wasPointerDown = pointerDown;

		if (!reducedMotion) {
			elapsed += delta;
			uniforms.uTime.value += delta;
			rotationY += delta * 0.018;
			breath = 1 + Math.sin(elapsed * 0.65) * 0.008;
		}
	});
</script>

<T.PerspectiveCamera
	bind:ref={camera}
	makeDefault
	position={[0, 0, 8.2]}
	fov={38}
	oncreate={(camera: PerspectiveCamera) => camera.lookAt(0.1, -0.3, 0)}
/>

<T.HemisphereLight args={['#ffe6f0', '#130006', 1.3]} />
<T.PointLight color="#fff8fb" intensity={52} distance={10} decay={2} position={[-3.2, 3.1, 4]} />
<T.PointLight color="#ff0b64" intensity={42} distance={9} decay={2} position={[3, -1.4, 2.8]} />
<T.PointLight color="#6438ff" intensity={28} distance={8} decay={2} position={[-2.4, 0, -2.6]} />

<T.Group bind:ref={revealGroup} scale={reveal.scale}>
	<T.Group
		position={[0.22, sceneY, 0]}
		rotation.x={rotationX}
		rotation.y={rotationY}
		rotation.z={-0.08}
		scale={sceneScale * breath}
	>
		<T.Mesh bind:ref={mesh} {geometry} {material} />
	</T.Group>
</T.Group>
