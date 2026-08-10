/* Process section: real Three.js glass 3D shapes for the 4 step visuals,
   replacing the flat CSS/SVG approximations with actual materials, lighting
   and reflections. Vanilla ES modules via CDN import map (index.html) — no
   build step, matching the rest of the site.

   Fails soft on purpose: no-WebGL, prefers-reduced-motion, or any error
   while building a scene just leaves that step's existing CSS/SVG shape
   showing (site.css .process__visual only hides the fallback once
   .has-3d is added, which only happens after a scene renders its first
   frame). Nothing here is required for the section to look complete. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var canvases = Array.prototype.slice.call(document.querySelectorAll('.process__canvas'));
  if (!canvases.length) return;

  try {
    var probe = document.createElement('canvas');
    var gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return;
  } catch (e) {
    return;
  }

  import('three').then(function (THREE) {
    import('three/addons/environments/RoomEnvironment.js').then(function (mod) {
      boot(THREE, mod.RoomEnvironment);
    }).catch(function () { boot(THREE, null); });
  }).catch(function () {
    /* three.js failed to load (CDN down, offline) — fallback shapes stay. */
  });

  function boot(THREE, RoomEnvironment) {
    var VIOLET = 0x7c5cfc;
    var CYAN = 0x8fd8ff;
    var maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    // One shared PMREM environment map (reflections) reused across every
    // scene — generating it is the expensive part, the result is just a
    // texture any number of materials can reference.
    var envTexture = null;
    if (RoomEnvironment) {
      var envRenderer = new THREE.WebGLRenderer({ antialias: false });
      var pmrem = new THREE.PMREMGenerator(envRenderer);
      envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      envRenderer.dispose();
    }

    // BUG FIX: instance creation used to run right here, before `var SHAPES
    // = {...}` further down. createInstance() reads SHAPES[shape]
    // synchronously, but `var` hoisting only hoists the declaration, not
    // the assignment — so SHAPES was still `undefined` at this point and
    // every call threw "Cannot read properties of undefined (reading
    // 'sphere')", uncaught, aborting boot() entirely. Net effect: none of
    // the Process section's 4 shapes ever actually rendered, always
    // silently sitting on the CSS/SVG fallback. Moved below SHAPES/
    // createInstance/glassMaterial; nothing else here changed.

    function createInstance(canvas) {
      var shape = canvas.dataset.shape;
      var builder = SHAPES[shape];
      if (!builder) return null;

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(maxPixelRatio);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      var scene = new THREE.Scene();
      if (envTexture) scene.environment = envTexture;

      var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      camera.position.set(0, 0.3, 4.4);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.35));
      var keyLight = new THREE.PointLight(VIOLET, 40, 20);
      keyLight.position.set(-3, 2.5, 3);
      scene.add(keyLight);
      var rimLight = new THREE.PointLight(CYAN, 30, 20);
      rimLight.position.set(3, -1.5, 2.5);
      scene.add(rimLight);
      var fillLight = new THREE.PointLight(0xffffff, 12, 20);
      fillLight.position.set(0, 3, -2);
      scene.add(fillLight);

      var group = builder(THREE, VIOLET, CYAN);
      scene.add(group);

      var inst = {
        canvas: canvas,
        renderer: renderer,
        scene: scene,
        camera: camera,
        group: group,
        active: true,
        animate: function (t) {
          group.rotation.y = t * 0.28;
          group.position.y = Math.sin(t * 0.6) * 0.12;
          if (!canvas.parentElement.classList.contains('has-3d')) {
            canvas.parentElement.classList.add('has-3d');
          }
        },
        resize: function () {
          var w = canvas.clientWidth;
          var h = canvas.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        },
      };
      canvas.__process3d = inst;
      return inst;
    }

    function glassMaterial(THREE, color) {
      return new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0,
        roughness: 0.06,
        transmission: 1,
        thickness: 1.4,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.3,
        attenuationColor: new THREE.Color(color),
        attenuationDistance: 1.2,
      });
    }

    var SHAPES = {
      // 01 Discover: a single glass sphere — the reference's clean orb.
      sphere: function (THREE, violet) {
        var group = new THREE.Group();
        var geo = new THREE.SphereGeometry(1.15, 64, 64);
        group.add(new THREE.Mesh(geo, glassMaterial(THREE, violet)));
        return group;
      },
      // 02 Design: a torus knot — architecture/interface decisions woven
      // together, matching the interlocking-rings reference.
      torusknot: function (THREE, violet) {
        var group = new THREE.Group();
        var geo = new THREE.TorusKnotGeometry(0.78, 0.24, 160, 24);
        group.add(new THREE.Mesh(geo, glassMaterial(THREE, violet)));
        return group;
      },
      // 03 Build: a cluster of glass cubes at slightly different scales and
      // offsets, each spinning on its own axis — reads as active assembly
      // rather than one frozen block.
      cubes: function (THREE, violet, cyan) {
        var group = new THREE.Group();
        var specs = [
          { pos: [-0.55, 0.4, 0.1], scale: 0.68, color: violet, speed: 0.6 },
          { pos: [0.6, -0.15, -0.2], scale: 0.9, color: cyan, speed: -0.45 },
          { pos: [0.05, 0.75, -0.5], scale: 0.55, color: violet, speed: 0.8 },
        ];
        specs.forEach(function (s) {
          var geo = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
          var mesh = new THREE.Mesh(geo, glassMaterial(THREE, s.color));
          mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
          mesh.scale.setScalar(s.scale);
          mesh.rotation.set(0.5, 0.4, 0);
          mesh.userData.spin = s.speed;
          group.add(mesh);
        });
        group.userData.cubes = group.children;
        var baseAnimate = group.userData;
        group.tick = function (t) {
          group.children.forEach(function (mesh) {
            mesh.rotation.x += 0.002 * mesh.userData.spin;
            mesh.rotation.y += 0.003 * mesh.userData.spin;
          });
        };
        return group;
      },
      // 04 Ship & support: a glass dome over a flat disc, with concentric
      // rings on the disc standing in for the reference's ripple pulse.
      dome: function (THREE, violet, cyan) {
        var group = new THREE.Group();
        var domeGeo = new THREE.SphereGeometry(1.05, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        var dome = new THREE.Mesh(domeGeo, glassMaterial(THREE, violet));
        dome.position.y = -0.05;
        group.add(dome);

        var discGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.05, 48);
        var discMat = new THREE.MeshPhysicalMaterial({
          color: cyan, metalness: 0.2, roughness: 0.25, transmission: 0.6,
          ior: 1.3, clearcoat: 0.6, envMapIntensity: 1,
        });
        var disc = new THREE.Mesh(discGeo, discMat);
        disc.position.y = -0.1;
        group.add(disc);

        [1.35, 1.6, 1.85].forEach(function (r, i) {
          var ringGeo = new THREE.TorusGeometry(r, 0.014, 8, 64);
          var ringMat = new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.35 - i * 0.08 });
          var ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -0.1;
          group.add(ring);
        });
        return group;
      },
    };

    var instances = canvases.map(function (canvas) {
      return createInstance(canvas);
    }).filter(Boolean);

    if (!instances.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var inst = entry.target.__process3d;
        if (inst) inst.active = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    instances.forEach(function (inst) { io.observe(inst.canvas.closest('.process__card')); });

    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        var inst = entry.target.__process3d;
        if (inst) inst.resize();
      });
    });
    instances.forEach(function (inst) { ro.observe(inst.canvas); inst.resize(); });

    var clock = new THREE.Clock();
    function tick() {
      var t = clock.getElapsedTime();
      instances.forEach(function (inst) {
        if (!inst.active) return;
        inst.animate(t);
        inst.renderer.render(inst.scene, inst.camera);
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
