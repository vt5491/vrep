/// <reference path="../../../typings/index.d.ts" />
import { Component, OnInit, ElementRef, Inject, ViewChild, Injectable, Renderer, Injector } from '@angular/core';
import { WebGLCanvasComponent } from '../directives/webgl-canvas/webgl-canvas.component';
import { VRSceneService, VRSceneServiceProvider } from '../services/vr-scene.service';
// import { SspScene } from '../ssp-scene';
// import { SspSceneService } from '../services/ssp-scene.service';
import { ISspScene } from '../interfaces/ssp-scene';
import { SspRuntime } from '../ssp-runtime';
import { SspTorusSceneService, SspTorusSceneProvider } from '../services/ssp-torus-scene.service';
import { SspCylSceneService, SspCylSceneProvider } from '../services/ssp-cyl-scene.service';
import { SspPlaneSceneService, SspPlaneSceneProvider } from '../services/ssp-plane-scene.service';
import { SspCubeScene, SspCubeSceneProvider } from '../services/ssp-cube-scene.service';
import { SspPyramidScene, SspPyramidSceneProvider } from '../services/ssp-pyramid-scene.service';
import { SspSphereScene, SspSphereSceneProvider } from '../services/ssp-sphere-scene.service';
import { BaseService } from '../services/base.service';
import { SspTorusRuntimeService } from '../services/ssp-torus-runtime.service';
import { SspCylRuntimeService } from '../services/ssp-cyl-runtime.service';
import { SspRuntimeService } from '../services/ssp-runtime.service';
import { KbdHandlerRouterService} from '../services/kbd-handler-router.service';
import { CameraKbdHandlerService} from '../services/camera-kbd-handler.service';
// import { AsteroidsMainService} from '../inner-games/asteroids/asteroids-main.service';
// import { AsteroidsGame, AsteroidsGameProvider } from '../inner-games/asteroids/asteroids-game';
import { AsteroidsGame } from '../inner-games/asteroids/asteroids-game';
import { AsteroidsKbdHandler } from '../inner-games/asteroids/asteroids-kbd-handler';
import { InnerGame } from '../interfaces/inner-game';
import { WebGLRenderTargetProvider, UtilsService } from '../services/utils.service';
import { ThreeJsSceneProvider } from '../services/utils.service';
import { Ship } from '../inner-games/asteroids/ship';

@Component({
  selector: 'app-torroids',
  templateUrl: './torroids.component.html',
  styleUrls: ['./torroids.component.css'],
  // providers: [ElementRef],
  providers: [VRSceneServiceProvider, WebGLCanvasComponent, SspTorusSceneProvider,
    SspCylSceneProvider, SspPlaneSceneProvider, SspCubeSceneProvider,
    SspPyramidSceneProvider, SspSphereSceneProvider,
    // AsteroidsMainService,
    // note: we get a global singleton AsteroidsGame in app.module
    // AsteroidsGameProvider,
    //THREE.WebGLRenderTarget
    WebGLRenderTargetProvider, ThreeJsSceneProvider,
    // Ship,
    KbdHandlerRouterService,
  // BaseService
  ]
})

// @ViewChild('webGLCanvas') someElement;

@Injectable()
export class TorroidsComponent implements OnInit {
  // @ViewChild(WebGLCanvasComponent) webGLCanvas : WebGLCanvasComponent;

  webGLRenderer: THREE.WebGLRenderer;
  gl_webGLRenderer: any;
  canvasWidth: number;
  canvasHeight: number;
  // private el: ElementRef;
  // vrScene : VRSceneService;
  // sspScene : SspScene;
  // private _sspScene : SspSceneService;
  private _sspScene : ISspScene;
  sspRuntime: SspRuntimeService;
  // sspTorusRuntimeService : SspTorusRuntimeService;
  // model : { [outerScene : string] : string} = {};
  model : any = {};
  outerScene : String;
  //TODO create an official interface for this type
  // innerGame : any;
  innerGame : InnerGame;
  gPad : Gamepad;

  constructor(
    private el: ElementRef,
    // private _sspTorusSceneService: SspTorusSceneService,
    // public baseService: BaseService,
    public base: BaseService,
    private renderer : Renderer,
    private _kbdHandlerRouter : KbdHandlerRouterService,
    private injector: Injector,
    // private _sspScene: SspSceneService,
    // public sspTorusRuntimeService: SspTorusRuntimeService
    private utils: UtilsService
    )
  {
    console.log(`TorroidComponent.ctor: entered`);
    // this.model = {
    //   outerScene: "torus"
    // };
    // this sets which option is checked by default
    // this.model.outerScene = 'cube';
    this.model.outerScene = 'plane';
    this.model.enableCameraTracking = false;
    console.log('TorroidComponent: ctor: _kbdHandlerRouterService=' + this._kbdHandlerRouter);
    // console.log('TorroidComponent: ctor: baseService=' + this.baseService);
    this.innerGame = this.injector.get(AsteroidsGame);
    let control = new function() {
      this.canvasWidth = 500;
      // this.innerGame.ship.mesh.position.x
     };

    this.utils.addControls(control);
    // this.utils.addStats();
  }

  ngOnInit() {
    console.log('TorroidsComponent.ngOnInit: entered');
    // this.utils.addStats();
  }

  initOuterScene() {
    console.log(`TorroidsComponent.initOuterScene: entered`);
    let webglDiv = this.el.nativeElement.querySelector('#webgl-container');
    webglDiv.appendChild(this.webGLRenderer.domElement).setAttribute("id", 'webgl-renderer-canvas');
    // webglDiv.setAttribute("id", 'webgl-renderer');

    // Note: setting this value doesn't seem to have any effect (?)
    // this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    // this.webGLRenderer.setSize(1024 * 4.0, 1024 * 4.0);
    // this.webGLRenderer.setSize(window.innerWidth * 2.0, window.innerHeight * 2.0);

    let webglRendererCanvas : HTMLElement = this.el.nativeElement.querySelector('#webgl-renderer-canvas');
    // note: this is needed to give the element keyboard focus
    webglRendererCanvas.setAttribute('tabindex', "1");
    let listenFunc = this.renderer.listen(webglRendererCanvas, 'keydown', (event) => {
      // console.log(`listenFunc: event=${event}`);
      this.kbdEventHandler(event);
      // console.log('Element clicked');
    });

    // temp add some gamepad support here, until we can be sure enough to move
    // to its own module
    window.addEventListener("gamepadconnected", function (e : any) {
      console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id,
        e.gamepad.buttons.length, e.gamepad.axes.length);
      this.gPad = navigator.getGamepads()[e.gamepad.index];
    });


    // // add a GridHelper
    // let gridHelper = new THREE.GridHelper( 9, 9 );
    // gridHelper.rotateX(this.baseService.ONE_DEG * 90.0);
    // this.sspScene.vrSceneService.scene.add(gridHelper);
    // add a GridHelper
    // let gridHelper = new THREE.GridHelper(100, 10);
    // let gridHelper = new THREE.GridHelper(50, 10);
    let gridHelper_xy = new THREE.GridHelper(100, 20);
    gridHelper_xy.rotateX(this.base.ONE_DEG * 90.0);
    this.sspScene.vrScene.scene.add(gridHelper_xy);

    let gridHelper_xz = new THREE.GridHelper(100, 20);
    gridHelper_xz.rotateX(this.base.ONE_DEG * 0.0);
    this.sspScene.vrScene.scene.add(gridHelper_xz);

    let gridHelper_yz = new THREE.GridHelper(100, 20);
    gridHelper_yz.rotateZ(this.base.ONE_DEG * 90.0);
    // this.sspScene.vrScene.scene.add(gridHelper_yz);

    let axisHelper = new THREE.AxisHelper( 10 );
    this.sspScene.vrScene.scene.add( axisHelper );

    webglRendererCanvas.focus();
    document.getElementById('webgl-renderer-canvas').focus();
  }

  debugButtonClick(input, $event) {
    // console.log(`TorroidsComponent.debugButtonClick: webGLCanvasComponent.width=
    //   ${this.webGLCanvas.webGLRenderer.getSize().width}`);
  }

  startButtonClick(input, $event) {
    // this.quickScene();
    console.log('TorroidComponent: startGame: outerScene=' + this.outerScene);
    this.startGame();
  }

  startGame() {
    console.log('TorroidsComponent.startGame: entered');
    console.log('TorroidsComponent.startGame: this.model.outerScene=' + this.model.outerScene);

    this.utils.parms.enableCameraTracking = this.model.enableCameraTracking;
    // this.innerGame = this.injector.get(AsteroidsMainService);

    switch (this.model.outerScene) {
      case 'torus':
        this.sspScene = this.injector.get(SspTorusSceneService);
        break;

      case 'cyl':
        this.sspScene = this.injector.get(SspCylSceneService);

        break;
      case 'plane':
        this.sspScene = this.injector.get(SspPlaneSceneService);

        break;

      case 'cube':
        this.sspScene = this.injector.get(SspCubeScene);

        break;

      case 'pyramid':
        this.sspScene = this.injector.get(SspPyramidScene);

        break;

      case 'sphere':
        this.sspScene = this.injector.get(SspSphereScene);

        break;
      default:
        console.log('invalid switch selection');
    }

    //TODO: these next lines means the client has to know low-levels of
    // kbdHandlerRouter.  Is there a way to eliminate this?
    //set the dolly of the cameraKbdHandler
    this.kbdHandlerRouter.cameraKbdHandler.dolly = this.sspScene.vrScene.dolly;

    //set the ship of the asteroidsKdbHandler
    //  this.kbdHandlerRouter.asteroidsKbdHandler.ship = (<AsteroidsGame>this.innerGame).ship;
    // this.kbdHandlerRouter.asteroidsKbdHandler.asteroidsGame.ship = (<AsteroidsGame>this.innerGame).ship;

    console.log(`TorroidsComponent.startGame: this.innerGame.asteroidsGame.asteroids[0].vx= ${(<any>this.innerGame).asteroids[0].vx}`);
    console.log(`TorroidsComponent.startGame: this.innerGame.asteroidsGame.asteroids[0].vx= ${(<any>this.innerGame).asteroids[0].vx}`);
    this.webGLRenderer = this.sspScene.vrScene.webGLRenderer;
    // this.sspRuntime = new SspRuntimeService(this.sspScene.vrSceneService, this.innerGame);
    // this.sspRuntime = new SspRuntimeService(this.sspScene.vrSceneService,
    this.sspRuntime = new SspRuntimeService(
      this.sspScene,
      this.injector.get(THREE.WebGLRenderTarget),
      this.innerGame,
      this.injector.get(CameraKbdHandlerService),
      this.injector.get(UtilsService)
      );
    this.initOuterScene();

    // let control = new function() {
    //   this.canvasWidth = 500;
    //   // this.sspScene.sspSurface.position.x = 100;
    //   // this.innerGame.asteroidsGame.asteroids[0].vx=0.1;
    // };
    // this.utils.addControls(control);
    this.utils.addStats();

    this.sspRuntime.mainLoop();
  }

  kbdEventHandler($event) {
    this.kbdHandlerRouter.keyEventHandler($event);
  };

  onResize(event) {
    console.log('TorroidsComponent.onResize: event=' + event)
    // var camera = this.vrRuntime.vrScene.camera;
    var camera = this.sspRuntime.outerVrScene.camera;
    // var renderer = this.vrRuntime.vrRenderer.renderer
    var renderer = this.sspRuntime.webGLRenderer;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    // and inform the inner game as well
    this.sspRuntime.onResize(event);
  }

  // Getters and Setters
  get kbdHandlerRouter(): KbdHandlerRouterService {
    return this._kbdHandlerRouter;
  };
  // get sspScene(): SspSceneService {
  //   return this._sspScene;
  // };
  // set sspScene(newSspScene : SspSceneService) {
  //   this._sspScene = newSspScene;
  // };
  get sspScene(): ISspScene {
    return this._sspScene;
  };
  set sspScene(newSspScene : ISspScene) {
    this._sspScene = newSspScene;
  };
}
