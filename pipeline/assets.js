// ---------- assets: GLBs embedded as base64 <script id="asset_NAME"> blocks by add_assets.py, decoded on first use ----------
// nothing waits on them: the world shows first and whoever asked gets a promise
const ASSETS=(()=>{
  const cache=new Map();let libs=null;
  const lib=()=>libs||(libs=Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/libs/meshopt_decoder.module.js'),import('three/addons/utils/SkeletonUtils.js')])
    .then(([G,M,S])=>{const L=new G.GLTFLoader();L.setMeshoptDecoder(M.MeshoptDecoder);ASSETS.SkeletonUtils=S;return L;}));
  const bytes=name=>{const e=document.getElementById('asset_'+name);if(!e)throw new Error('no asset '+name);
    const s=atob(e.textContent.trim()),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b.buffer;};
  return{SkeletonUtils:null,
    has:name=>!!document.getElementById('asset_'+name),
    load(name){if(!cache.has(name))cache.set(name,lib().then(L=>L.parseAsync(bytes(name),'')));return cache.get(name);},
    // skinned meshes need their own skeleton per copy; only valid once a load has resolved
    clone:o=>ASSETS.SkeletonUtils.clone(o)};
})();
