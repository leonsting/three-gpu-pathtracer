import { RGBAFormat, FloatType, Color, Vector2, WebGLRenderTarget } from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

function* renderTask() {

	const { _fsQuad, _renderer, target, camera, material } = this;
	const tx = this.tiles.x || 1;
	const ty = this.tiles.y || 1;

	while ( true ) {

		// TODO: jitter camera

		material.opacity = 1 / ( this.samples + 1 );
		material.seed = ( material.seed + 0.11111 ) % 2;

		const w = target.width;
		const h = target.height;
		camera.setViewOffset(
			w, h,
			Math.random() - 0.5, Math.random() - 0.5,
			w, h,
		);
		camera.updateProjectionMatrix();

		for ( let y = 0; y < ty; y ++ ) {

			for ( let x = 0; x < tx; x ++ ) {

				material.cameraWorldMatrix.copy( camera.matrixWorld );
				material.invProjectionMatrix.copy( camera.projectionMatrixInverse );

				const ogRenderTarget = _renderer.getRenderTarget();
				const ogAutoClear = _renderer.autoClear;

				_renderer.setRenderTarget( target );
				_renderer.setScissorTest( true );
				_renderer.setScissor(
					Math.ceil( x * w / tx ),
					Math.ceil( ( ty - y - 1 ) * h / ty ),
					Math.ceil( w / tx ),
					Math.ceil( h / ty ) );
				_renderer.autoClear = false;
				_fsQuad.render( _renderer );

				_renderer.setScissorTest( false );
				_renderer.setRenderTarget( ogRenderTarget );
				_renderer.autoClear = ogAutoClear;

				yield;

			}

		}

		this.samples ++;

	}

}

const ogClearColor = new Color();
export class PathTracingRenderer {

	get material() {

		return this._fsQuad.material;

	}

	set material( v ) {

		this._fsQuad.material = v;

	}

	constructor( renderer ) {

		this.camera = null;
		this.tiles = new Vector2();
		this.target = new WebGLRenderTarget( 1, 1, {
			format: RGBAFormat,
			type: FloatType,
		} );
		this.samples = 0;
		this._renderer = renderer;
		this._fsQuad = new FullScreenQuad( null );
		this._task = null;

	}

	setSize( w, h ) {

		this.target.setSize( w, h );
		this.reset();

	}

	reset() {

		const renderer = this._renderer;
		const target = this.target;
		const ogRenderTarget = renderer.getRenderTarget();
		const ogClearAlpha = renderer.getClearAlpha();
		renderer.getClearColor( ogClearColor );

		// renderer.setRenderTarget( target );
		// renderer.setClearColor( 0, 0 );
		// renderer.clearColor();

		renderer.setClearColor( ogClearColor, ogClearAlpha );
		renderer.setRenderTarget( ogRenderTarget );

		this.samples = 0;
		this._task = null;

	}

	update() {

		if ( ! this._task ) {

			this._task = renderTask.call( this );

		}

		this._task.next();

	}

}
